/**
Здесь вы можете написать скрипты для сложной серверной обработки контекста во время выполнения процесса.
Для написания скриптов используйте TypeScript (https://www.typescriptlang.org).
Документация TS SDK доступна на сайте https://tssdk.elma365.com.
**/

// актуализируем данные в приложении 1C MDM Organisation забрав данные из 1C MDM

// type orgData = {
//     organization_id_1c: string,
//     organization_name: string,
//     organization_name_full: string,
//     organization_name_small: string,
//     inn: string,
//     kpp: string,
//     okpo: string,
//     ogrn: string,
//     typeact: string,
//     orgform: string,
// }

// const batchSize = 30;

async function getOrg(): Promise<void> {
    if (!Context.data.json_string || Context.data.json_string.length < 3) {
        let endpoint = encodeURI(Namespace.params.data.host_organizations);
        Namespace
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
            logApp.data.__name = "getOrg";
            logApp.data.host = endpoint;
            logApp.data.request = JSON.stringify(request);
            logApp.data.response = json_string;
            await logApp.save();
        }
    }

    Context.data.iter = 0;
    Context.data.elementscount = 0;
    Context.data.updatecomplete = false;

    let responseData: orgData[];
    responseData = JSON.parse(Context.data.json_string);
    Context.data.elementscount = responseData.length;
}

async function pocessBatch(): Promise<void> {
    let responseData: orgData[];
    if (!Context.data.iter)
        Context.data.iter = 0;
    if (Context.data.json_string) {
        responseData = JSON.parse(Context.data.json_string);
        Context.data.elementscount = responseData.length;
        if (Context.data.elementscount > 0) {
            if (!Context.data.updatecomplete) { 
                let persistedOrgs = await Context.fields.organizations.app.search().where(f => f.__deletedAt.eq(null)).sort("__createdAt").from(Context.data.iter! * batchSize).size(batchSize).all();
                if (persistedOrgs.length > 0) { //в базе ещё есть что то необработанное
                    Context.data.updatecomplete = false;
                } else {
                    Context.data.updatecomplete = true;
                }
                for (let persistedOrg of persistedOrgs) {
                    let orgData = responseData.find(f => (f.organization_id_1c == persistedOrg.data.organization_id_1c));
                    if (orgData) { //есть и в базе, и в интеграции
                        let hashData = cyrb53(JSON.stringify(orgData)).toString();
                        if (persistedOrg.data.hash != hashData || Namespace.params.data.forceupdate) //поменялись данные
                        {
                            persistedOrg.data.hash = hashData;
                            persistedOrg.data.last_updated_date = new Datetime();
                            persistedOrg.data.organization_name = orgData.organization_name;
                            persistedOrg.data.organization_name_full = orgData.organization_name_full;
                            persistedOrg.data.organization_name_small = orgData.organization_name_small;
                            persistedOrg.data.inn = orgData.inn;
                            persistedOrg.data.kpp = orgData.kpp;
                            persistedOrg.data.okpo = orgData.okpo;
                            persistedOrg.data.ogrn = orgData.ogrn;
                            persistedOrg.data.typeact = orgData.typeact;
                            persistedOrg.data.orgform = orgData.orgform;
                            await persistedOrg.save();
                        } //если данные не поменяли, ничего не делаем

                        //удаляем из массива интеграции обработанный элемент
                        let orgIndex = responseData.indexOf(orgData, 0);
                        if (orgIndex > -1)
                            responseData.splice(orgIndex, 1);
                    } else { //не пришли в интеграции - удаляем
                        await persistedOrg.delete();
                    }
                }
            } else {
                let orgIndex = 0;
                while (orgIndex < batchSize) {
                    orgIndex++;
                    let orgData = responseData.pop();
                    if (orgData) {
                        let hashData = cyrb53(JSON.stringify(orgData)).toString();
                        let persistedOrg = await Context.fields.organizations.app.create();
                        persistedOrg.data.organization_id_1c = orgData.organization_id_1c;
                        persistedOrg.data.hash = hashData;
                        persistedOrg.data.last_updated_date = new Datetime();
                        persistedOrg.data.organization_name = orgData.organization_name;
                        persistedOrg.data.organization_name_full = orgData.organization_name_full;
                        persistedOrg.data.organization_name_small = orgData.organization_name_small;
                        persistedOrg.data.inn = orgData.inn;
                        persistedOrg.data.kpp = orgData.kpp;
                        persistedOrg.data.okpo = orgData.okpo;
                        persistedOrg.data.ogrn = orgData.ogrn;
                        persistedOrg.data.typeact = orgData.typeact;
                        persistedOrg.data.orgform = orgData.orgform;
                        await persistedOrg.save();
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
