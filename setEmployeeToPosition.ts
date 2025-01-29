/**
Here you can write scripts for complex server processing of the context during process execution.
To write scripts, use TypeScript (https://www.typescriptlang.org).
ELMA365 SDK documentation available on https://tssdk.elma365.com.
**/

async function SetEmploee(): Promise<void> {
    let orgs = await Context.fields.orgstructure.app.search().where(f => f.__deletedAt.eq(null)).size(1000).all();
    let emps = await Context.fields.employees.app.search().where(f => f.__deletedAt.eq(null)).size(10000).all();
    let tree = await System.organisationStructure.fetchTree();

    let parent = tree.getRoot();

    await SetChildEmployees(orgs, emps, parent);
}

async function SetChildEmployees(orgs: BaseApplicationItem<Application$n1c_mdm_debug$orgstructure$Data, Application$n1c_mdm_debug$orgstructure$Params>[],
    emps: BaseApplicationItem<Application$n1c_mdm_debug$employees$Data, Application$n1c_mdm_debug$employees$Params>[],
    parent: OrganisationStructureItem): Promise<void> {
    let childrenPositions = parent.getChildren();

    for (let childPosition of childrenPositions) {
        await SetChildEmployees(orgs, emps, childPosition);
        if (childPosition.isPosition()) {
            let parentDep = childPosition.getParent();
            if (parentDep && parentDep.isDepartment()) {
                let dep = orgs.filter(f => (f.data.department_id_elma == parentDep!.id))[0];
                if (dep) {
                    let headEmpPosELMA = dep.data.head_person_pos_elma;
                    let headEmp = emps.filter(f => f.data.pos_elma == headEmpPosELMA).pop();
                    if (headEmp) {
                        let user = await System.users.search().where((f, g) => g.and(f.__deletedAt.eq(null), f.additionalData.eq(headEmp!.data.snils!))).first();
                        if (user) {
                            user.assignToPosition(childPosition);
                            await user.save();
                        }
                    }
                }
            }
        }
        if (childPosition.isGroup()) {
            let parentHead = childPosition.getParent();
            Context.data.log = Context.data.log + ` childPosition: ${childPosition.id}`;
            if (parentHead && parentHead.isPosition()) {
                Context.data.log = Context.data.log + ` parentHead: ${parentHead.id}`;
                let parentDep = parentHead.getParent();
                if (parentDep && parentDep.isDepartment()) {
                    Context.data.log = Context.data.log + ` parentDep: ${parentDep.id}`;
                    let dep = orgs.filter(f => (f.data.department_id_elma == parentDep!.id))[0];
                    if (dep) {
                        Context.data.log = Context.data.log + ` dep: ${dep.id}`;
                        Context.data.log = Context.data.log + ` dep.data.department_id_1c: ${dep.data.department_id_1c}`;
                        Context.data.log = Context.data.log + ` childPosition.data.name: ${childPosition.data.name}`;
                        let empList = emps.filter(f => (f.data.department_id_1c == dep.data.department_id_1c && f.data.__name == childPosition.data.name));
                        for (let emp of empList) {
                            Context.data.log = Context.data.log + ` emp: ${emp.id}`;
                            Context.data.log = Context.data.log + ` emp.data.snils: ${emp.data.snils}`;
                            let user = await System.users.search().where((f, g) => g.and(f.__deletedAt.eq(null), f.additionalData.eq(emp.data.snils!))).first();
                            if (user) {
                                Context.data.log = Context.data.log + ` user: ${user.id}`;
                                user.assignToPosition(childPosition);
                                await user.save();
                            }
                        }
                    }
                }
            }
        }
    }
}
