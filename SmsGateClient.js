const crypto = require('crypto')
const fetch = require('node-fetch')
const xml2json = require('xml2json')

const ErrorCodes = {
  '-1': 'Duplicitní ”user_id” - stejně označená SMS byla odeslaná již v minulosti',
  '1': 'Neznámá chyba',
  '2': 'Neplatný login',
  '3': 'Neplatný ”hash” nebo ”password” (podle varianty zabezpečení přihlášení)',
  '4': 'Neplatný ”time”, větší odchylka času mezi servery než maximální akceptovaná v nastavení služby SMS Connect',
  '5': 'Nepovolená IP, viz nastavení služby SMS Connect',
  '6': 'Neplatný název akce',
  '7': 'Tato ”salt” byla již jednou za daný den použita',
  '8': 'Nebylo navázáno spojení s databází',
  '9': 'Nedostatečný kredit',
  '10': 'Neplatné číslo příjemce SMS',
  '11': 'Prázdný text zprávy',
  '12': 'SMS je delší než povolených 459 znaků',
}

class SmsBody {
  /**
   * Telefonní číslo v národním (např. 736339339) nebo mezinárodním tvaru
   * (např. +420736339339), zahraniční čísla musí být vždy v mezinárodním tvaru
   * s předvolbou státu
   * */
  number;

  /**
   * Text zprávy bez diakritiky (”7bit”).
   * Délka SMS: 1 SMS do 160 znaků, 2 SMS do 306 znaků, 3 SMS do 459 znaků.
   * Pro SMS s diakritikou použijte kódování ”ucs2”.
   * */
  message;

  /** Kdy nejdříve odeslat konkrétní SMS, formát zápisu je YYYYMMDDTHHMMSS (GTM+02:00) */
  when;

  /** 1 = s doručenkou (defaultní), 0 = bez doručenky */
  delivery_report;

  /**
   * Číslo odesílatele, u jednotlivých autorizovaných čísel je vždy zobrazeno i jejich ID
   */
  sender_id;

  /** Číslo odesílatele, pokud jej chcete nastavit přímo, číslo musí být v seznamu vašich autorizovaných čísel */
  sender_phone;

  /** Vlastní označení SMS pomocí varchar(50) hodnoty, systém akceptuje pouze jednu SMS se stejným user_id */
  user_id;

  /**
   * "7bit" (default) - standardní 160znaková SMS
   * "ucs2" - unicode (zprávy s diakritikou/spec. znaky), 70 znaků/sms, 67 znaků vícepartové SMS (2 SMS = 134 znaků)
   */
  data_code;

  /** E-mail, na který zaslat odpovědní SMS */
  answer_mail;

  /** E-mail, na který zaslat doručenky */
  delivery_mail;

  constructor(number, message) {
    this.number = number;
    this.message = message;
  }

}

class SmsGateUtils {
  get date() {
    const date = new Date();
    date.setHours(date.getHours() + 2);
    return date
  }

  getBaseUrl(searchParams = {}) {
    const url = new URL('https://api.smsbrana.cz/smsconnect/http.php');
    Object.entries(searchParams).forEach(([key, value]) => {
      if (typeof value !== 'undefined') {
        url.searchParams.append(key, value.toString())
      }
    });
    return url;
  }

  generateAuthHash = (password) => {
    const time = this.date.toISOString().replace(/-|:|\..*/g, '');
    const salt = crypto.createHash('md5').update(new Date().getTime().toString() + 'RandomSecretText').digest('hex');
    const hash = crypto.createHash('md5').update(password + time + salt).digest('hex');

    return {time, salt, hash};
  }
}

class Client extends SmsGateUtils {
  static ACTION_SEND_SMS = 'send_sms';
  static ACTION_CREDIT_INFO = 'credit_info';
  static ACTION_XML_QUEUE = 'xml_queue';
  static ACTION_INBOX = 'inbox';

  #login;
  #password;

  constructor(login, password) {
    super();

    this.#login = login;
    this.#password = password;
  }

  #createGetRequest = async (queryParams) => {
    const {time, salt, hash} = this.generateAuthHash(this.#password);
    const authParams = {login: this.#login, time, salt, auth: hash};

    return fetch(this.getBaseUrl({...authParams, ...queryParams}))
      .then(async e => {
        const response = JSON.parse(xml2json.toJson(await e.text()));

        if (response.result && response.result.err !== '0') {
          response.result.err = ErrorCodes[response.result.err] || response.result.err
        }

        return response;
      })
  }

  #createPostRequest = async (queryParams, bodyRequest) => {
    const {time, salt, hash} = this.generateAuthHash(this.#password);
    const authParams = {login: this.#login, time, salt, auth: hash};

    return fetch(this.getBaseUrl({...authParams, ...queryParams}), {
      method: 'POST',
      body: bodyRequest
    })
      .then(async e => {
        const response = JSON.parse(xml2json.toJson(await e.text()));

        if (response.result && response.result.err !== '0') {
          response.result.err = ErrorCodes[response.result.err] || response.result.err
        }

        return response;
      })
  }

  sendSms(smsBody) {
    if (!(smsBody instanceof SmsBody)) {
      throw new Error('Parameter must be instance of SmsBody')
    }

    const queryParams = {
      action: Client.ACTION_SEND_SMS,
    };

    Object.entries(smsBody).forEach(([key, value]) => queryParams[key] = value);

    return this.#createGetRequest(queryParams);
  }

  sendMultipleSms(smsBodyArray) {
    if (!smsBodyArray.length) {
      throw new Error('Parameter must be Array of SmsBody instances')
    }

    if (smsBodyArray.find(sms => !(sms instanceof SmsBody))) {
      throw new Error('Parameter must be Array of SmsBody instances')
    }

    const smsRequest = {
      queue: {
        sms: []
      }
    }

    smsBodyArray.forEach((sms, index) => {
      smsRequest.queue.sms[index] = {};
      Object.entries(sms).forEach(([key, value]) => {
        if (typeof value !== 'undefined') {
          smsRequest.queue.sms[index][key] = {$t: value}
        }
      })
    })

    const queryParams = {
      action: Client.ACTION_XML_QUEUE,
    };

    const requestBody = xml2json.toXml(smsRequest)

    return this.#createPostRequest(queryParams, requestBody);
  }

  getCreditStatus() {
    const queryParams = {
      action: Client.ACTION_CREDIT_INFO,
    };

    return this.#createGetRequest(queryParams);
  }

  getAcceptedMessages() {
    let queryParams = {
      action: Client.ACTION_INBOX,
    };

    return this.#createGetRequest(queryParams);
  }

}

module.exports = {Client, SmsBody};
