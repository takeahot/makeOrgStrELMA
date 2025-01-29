/**
Here you can write scripts for complex server processing of the context during process execution.
To write scripts, use TypeScript (https://www.typescriptlang.org).
ELMA365 SDK documentation available on https://tssdk.elma365.com.
**/
async function publishToCRM(): Promise<void> {
    let contMDMList = await Context.fields.contractors.app.search().where((f, g) => g.and(f.__deletedAt.eq(null))).size(10000).all();
    let contCRMList = await Context.fields.kompaniya.app.search().where((f, g) => g.and(f.__deletedAt.eq(null))).size(10000).all();

    while (true) {
        let contMDM = contMDMList.pop();
        if (contMDM) {
            let contrCRMList = contCRMList.filter(f=>(f.data._inn == contMDM!.data.inn && f.data._kpp == contMDM!.data.kpp));
            if (contrCRMList.length > 0) {
                let contCRM = contrCRMList[0];
                contCRM.data.__name = contMDM.data.__name;
                contCRM.data._inn = contMDM.data.inn;
                contCRM.data._kpp = contMDM.data.kpp;
                contCRM.data._ogrn = contMDM.data.ogrn;
                contCRM.data._legalName = contMDM.data.kontragent_name_full;
                await contCRM.save();
            } else {
                let newcontCRM = await Context.fields.kompaniya.app.create();
                newcontCRM.data.__name = contMDM.data.__name;
                newcontCRM.data._inn = contMDM.data.inn;
                newcontCRM.data._kpp = contMDM.data.kpp;
                newcontCRM.data._ogrn = contMDM.data.ogrn;
                newcontCRM.data._legalName = contMDM.data.kontragent_name_full;
                await newcontCRM.save();
            }
        } else {
            return;
        }
    }
}