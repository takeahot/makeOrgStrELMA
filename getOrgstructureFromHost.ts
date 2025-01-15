/**
Здесь вы можете написать скрипты для сложной серверной обработки контекста во время выполнения процесса.
Для написания скриптов используйте TypeScript (https://www.typescriptlang.org).
Документация TS SDK доступна на сайте https://tssdk.elma365.com.
**/

// Название: Лог, Код: log, Тип: Приложение, Подтип: Один (Лог), Полнотекстовый поиск: Нет, Сортировка: Нет
// Название: OrgStructure, Код: OrgStructure, Тип: Приложение, Подтип: Один (OrgStructure), Полнотекстовый поиск: Нет, Сортировка: Нет
// Название: JSON String, Код: json_string, Тип: Строка, Подтип: Текст, Полнотекстовый поиск: Нет, Сортировка: Нет
// Название: iter, Код: iter, Тип: Число, Подтип: Целое, Полнотекстовый поиск: Нет, Сортировка: Нет
// Название: elementsCount, Код: elementscount, Тип: Число, Подтип: Целое, Полнотекстовый поиск: Нет, Сортировка: Нет
// Название: updateComplete, Код: updatecomplete, Тип: Выбор «да/нет», Подтип: Переключатель, Полнотекстовый поиск: Нет, Сортировка: Нет
// Название: debugString, Код: debugstring, Тип: Строка, Подтип: Текст, Полнотекстовый поиск: Нет, Сортировка: Нет

type orgstructData = {
    company_id_1c: string,
    parent_department_id_1c: string,
    department_id_1c: string,
    department_name: string,
    head_person_id_1c: string,
    date_start: string,
    date_end: string,
    source_1c_id: string,
    show_on_portal: boolean,
    cfo_id_1c: string,
}

// const batchSize = 30;

async function getOrgstruct(): Promise<void> {
    if (!Context.data.json_string || Context.data.json_string.length < 3) {
        let endpoint = encodeURI(Namespace.params.data.host_org);
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

    let responseData: orgstructData[];
    responseData = JSON.parse(Context.data.json_string);
    Context.data.elementscount = responseData.length;
}
//запускется по циклу , пока elementscount > 0
async function pocessBatch(): Promise<void> {
    let responseData: orgstructData[];
    if (!Context.data.iter)
        Context.data.iter = 0;
    if (Context.data.json_string) {
        responseData = JSON.parse(Context.data.json_string);
        Context.data.elementscount = responseData.length;
        if (Context.data.elementscount > 0) {
            if (!Context.data.updatecomplete) {
                // загружаем из приложения OrgStructure batchSize записей не удаленных отсортированных по дате создания начиная с iter*batchSize
                let persistedOrgs = await Context.fields.OrgStructure.app.search().where(f => f.__deletedAt.eq(null)).sort("__createdAt").from(Context.data.iter! * batchSize).size(batchSize).all();
                if (persistedOrgs.length > 0) { //в базе ещё есть что то необработанное
                    Context.data.updatecomplete = false;
                    //проходим по всем записям из кучи находим по department_id_1c в данных полученных по API и обновляем если не совпадают хеши
                    for (let persistedOrg of persistedOrgs) {
                        let orgData = responseData.find(f => (f.department_id_1c == persistedOrg.data.department_id_1c));
                        if (orgData && orgData.date_end == '') { //есть и в базе, и в интеграции, не удалено
                            let hashData = cyrb53(JSON.stringify(orgData)).toString();
                            if (persistedOrg.data.hash != hashData) //поменялись данные
                            {
                                await putJSONDataToELMAAppItem(orgData, persistedOrg, '');
                            } //если данные не поменяли, ничего не делаем

                            //удаляем из массива интеграции обработанный элемент
                            let orgIndex = responseData.indexOf(orgData, 0);
                            if (orgIndex > -1)
                                responseData.splice(orgIndex, 1);
                        } else { //не пришли в интеграции или заполнена дата закрытия - удаляем
                                await persistedOrg.delete();
                        }
                    }
                } else {
                    Context.data.updatecomplete = true;
                }
           } else {
                let orgIndex = 0;
                while (orgIndex < batchSize) {
                    orgIndex++;
                    let orgData = responseData.pop();
                    if (orgData) {
                        if (orgData.date_end == '') { //обрабатываем, если не заполнена дата закрытия
                            let persistedOrg = await Context.fields.OrgStructure.app.create();
                            await putJSONDataToELMAAppItem(orgData, persistedOrg, orgData.department_id_1c);
                        } else {

                        }
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

async function runProcess(): Promise<void> {
    await getOrgstruct();
    while (Context.data.elementscount! > 0) {
        await pocessBatch();
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

const propertyMappingTable = `
"Свойства из JSON по запросу dep","Описание","Код свойства из элемента из приложения OrgStructure","Имя свойства из элемента из приложения OrgStructure","Преобразование данных"
"company_id_1c","id организации, к которой принадлежит подразделение","company_id_1c","company_id_1c","Прямое соответствие"
"parent_department_id_1c","id родителя (подразделения верхнего уровня или организации)","parent_department_id_1c","parent_department_id_1c","Прямое соответствие"
"department_name","наименование подразделения (организации)","department_name","department_name","Прямое соответствие"
"head_person_id_1c","СНИЛС руководителя подразделения","head_person_id_1c","head_person_id_1c","Прямое соответствие"
"date_start","дата создания подразделения","date_start","date_start","Прямое соответствие"
"date_end","дата расформирования подразделения","date_end","date_end","Прямое соответствие"
"source_1c_id","принадлежность к структуре","source_1c_id","source_1c_id","Прямое соответствие"
"show_on_portal","true - если необходимо закрыть к показу на портале","show_on_portal","show_on_portal","Прямое соответствие"
"cfo_id_1c","идентификатор финансового отдела","cfo_id_1c","cfo_id_1c","Прямое соответствие"
`;

function parseCSVRow(row: string): string[] {
    const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
    const result: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(row)) !== null) {
        if (match[1]) {
            result.push(match[1].replace(/""/g, '"').trim());
        } else {
            result.push(match[2].trim());
        }
    }

    return result;
}

async function putJSONDataToELMAAppItem(orgData: orgstructData, persistedAppItem: any, department_id_1c: string): Promise<void> {
    let hashData = cyrb53(JSON.stringify(orgData)).toString();
    persistedAppItem.data.hash = hashData;
    persistedAppItem.data.last_updated_date = new Datetime();

    const rows = propertyMappingTable.trim().split('\n').slice(1);
    for (const row of rows) {
        const [jsonProp, , appItemProp] = parseCSVRow(row);
        persistedAppItem.data[appItemProp] = orgData[jsonProp];
    }

    if (department_id_1c) {
        persistedAppItem.data.department_id_1c = department_id_1c;
    }
    await persistedAppItem.save();
}
