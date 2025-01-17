/**
Здесь вы можете написать скрипты для сложной серверной обработки контекста во время выполнения процесса.
Для написания скриптов используйте TypeScript (https://www.typescriptlang.org).
Документация TS SDK доступна на сайте https://tssdk.elma365.com.
**/

// "person_id_1c": "5c94fd44-3f14-4ccb-8014-c3d40fb9fc7a",
// "last_name": "Голыгин",
// "first_name": "Алексей",
// "second_name": "Николаевич",
// "birth_date": "1980-03-02",
// "inn": "771306454624",
// "snils": "030-070-277 86",
// "source_1c_id": "integrator",
// "gender": "М",
// "email": ""

type fizData = {
    birth_date: string,
    email: string,
    first_name: string,
    gender: string,
    inn: string,
    last_name: string,
    person_id_1c: string,
    second_name: string,
    snils: string,
    source_1c_id: string,
}

const batchSize = 30;

async function getFiz(): Promise<void> {
    if (!Context.data.json_string || Context.data.json_string.length < 3) {
        let endpoint = encodeURI(Namespace.params.data.host_fiz);
        let login = Namespace.params.data.basic_login;
        let pass = Namespace.params.data.basic_pass;
        let request: FetchRequest;
        request = {
            method: "GET",
            headers: {
                'Authorization': 'Basic ' + btoa(`${login}:${pass}`)
            }
        };

        let response = await fetch(endpoint, request);
        let json_string = await response.text();
        Context.data.json_string = json_string;
        if (Namespace.params.data.enable_log) {
            let logApp = await Context.fields.log.app.create();
            logApp.data.__name = "getFiz";
            logApp.data.host = endpoint;
            logApp.data.request = JSON.stringify(request);
            logApp.data.response = json_string;
            await logApp.save();
        }
    }

    Context.data.iter = 0;
    Context.data.elementscount = 0;
    Context.data.updatecomplete = false;

    let responseData: fizData[];
    responseData = JSON.parse(Context.data.json_string);
    Context.data.elementscount = responseData.length;
}

async function pocessBatch(): Promise<void> {
    let responseData: fizData[];
    if (!Context.data.iter)
        Context.data.iter = 0;
    if (Context.data.json_string) {
        responseData = JSON.parse(Context.data.json_string);
        Context.data.elementscount = responseData.length;
        if (Context.data.elementscount > 0) {
            if (!Context.data.updatecomplete) {
                let persistedFizs = await Context.fields.person.app.search().where(f => f.__deletedAt.eq(null)).sort("__createdAt").from(Context.data.iter! * batchSize).size(batchSize).all();
                Context.data.updatecomplete = true;
                if (persistedFizs.length > 0) { //в базе ещё есть что то необработанное
                    Context.data.updatecomplete = false;
                }
                for (let persistedFiz of persistedFizs) {
                    let fizData = responseData.find(f => (f.person_id_1c == persistedFiz.data.person_id_1c));
                    if (fizData) { //есть и в базе, и в интеграции
                        let hashData = cyrb53(JSON.stringify(fizData)).toString();
                        if (persistedFiz.data.hash != hashData) //поменялись данные
                        {
                            persistedFiz.data.hash = hashData;
                            persistedFiz.data.last_updated_date = new Datetime();
                            persistedFiz.data.birth_date = fizData.birth_date;
                            persistedFiz.data.email = fizData.email;
                            persistedFiz.data.first_name = fizData.first_name;
                            persistedFiz.data.gender = fizData.gender;
                            persistedFiz.data.inn = fizData.inn;
                            persistedFiz.data.last_name = fizData.last_name;
                            persistedFiz.data.second_name = fizData.second_name;
                            persistedFiz.data.snils = fizData.snils;
                            persistedFiz.data.source_1c_id = fizData.source_1c_id;
                            await persistedFiz.save();
                        } //если данные не поменяли, ничего не делаем

                        //удаляем из массива интеграции обработанный элемент
                        let fizIndex = responseData.indexOf(fizData, 0);
                        if (fizIndex > -1)
                            responseData.splice(fizIndex, 1);
                    } else { //не пришли в интеграции - удаляем
                        await persistedFiz.delete();
                    }
                }
            } else {
                let fizIndex = 0;
                while (fizIndex < batchSize) {
                    fizIndex++;
                    let fizData = responseData.pop();
                    if (fizData) {
                        let hashData = cyrb53(JSON.stringify(fizData)).toString();
                        let persistedFiz = await Context.fields.person.app.create();
                        persistedFiz.data.person_id_1c = fizData.person_id_1c;
                        persistedFiz.data.hash = hashData;
                        persistedFiz.data.last_updated_date = new Datetime();
                        persistedFiz.data.birth_date = fizData.birth_date;
                        persistedFiz.data.email = fizData.email;
                        persistedFiz.data.first_name = fizData.first_name;
                        persistedFiz.data.gender = fizData.gender;
                        persistedFiz.data.inn = fizData.inn;
                        persistedFiz.data.last_name = fizData.last_name;
                        persistedFiz.data.second_name = fizData.second_name;
                        persistedFiz.data.snils = fizData.snils;
                        persistedFiz.data.source_1c_id = fizData.source_1c_id;
                        await persistedFiz.save();
                    } else {
                        Context.data.json_string = "{}";
                        Context.data.elementscount = 0;
                        return;
                    }
                }
            }
        }
        Context.data.json_string = JSON.stringify(responseData);
        Context.data.elementscount = responseData.length;
        Context.data.debugstring = `elementscount: ${Context.data.elementscount}, updatecomplete: ${Context.data.updatecomplete}, iter: ${Context.data.iter}`;
        Context.data.iter = Context.data.iter + 1;
    }
}

const cyrb53 = (str: string) => {
    let seed = 0;
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};
