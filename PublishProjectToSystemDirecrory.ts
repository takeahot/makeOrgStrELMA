/**
Here you can write scripts for complex server processing of the context during process execution.
To write scripts, use TypeScript (https://www.typescriptlang.org).
ELMA365 SDK documentation available on https://tssdk.elma365.com.
**/
async function publishToSys(): Promise<void> {
    let projectMDMList = await Context.fields.projects.app.search().where((f, g) => g.and(f.__deletedAt.eq(null), f.status_name.neq('Завершен'))).size(10000).all();
    let projectSysList = await Context.fields.proekt.app.search().where((f, g) => g.and(f.__deletedAt.eq(null))).size(10000).all();

    while (true) {
        let projMDM = projectMDMList.pop();
        if (projMDM) {
            let projSysList = projectSysList.filter(f=>(f.data.code_in_1C == projMDM!.data.project_id_1c));
            if (projSysList.length > 0) {
                let projSys = projSysList[0];
                projSys.data.__name = projMDM.data.__name;
                if (projMDM && projMDM!.data.fincontroller_code && projMDM!.data.fincontroller_code != '')
                    projSys.data.financial_controller = await System.users.search().where(f=>f.additionalData.eq(projMDM!.data.fincontroller_code!)).first();
                if (projMDM && projMDM!.data.projecthead_code && projMDM!.data.projecthead_code != '')
                    projSys.data.project_manager = await System.users.search().where(f=>f.additionalData.eq(projMDM!.data.projecthead_code!)).first();
                //newprojSys.data.responsibles = projMDM!.data.;
                await projSys.save();
            } else {
                let newprojSys = await Context.fields.proekt.app.create();
                newprojSys.data.__name = projMDM.data.__name;
                newprojSys.data.code_in_1C = projMDM!.data.project_id_1c;
                if (projMDM && projMDM!.data.fincontroller_code && projMDM!.data.fincontroller_code != '')
                    newprojSys.data.financial_controller = await System.users.search().where(f=>f.additionalData.eq(projMDM!.data.fincontroller_code!)).first();
                if (projMDM && projMDM!.data.projecthead_code && projMDM!.data.projecthead_code != '')
                    newprojSys.data.project_manager = await System.users.search().where(f=>f.additionalData.eq(projMDM!.data.projecthead_code!)).first();
                //newprojSys.data.responsibles = projMDM!.data.;
                await newprojSys.save();
            }
        } else {
            return;
        }
    }
}