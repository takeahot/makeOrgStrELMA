/**
Здесь вы можете написать скрипты для сложной серверной обработки контекста во время выполнения процесса.
Для написания скриптов используйте TypeScript (https://www.typescriptlang.org).
Документация TS SDK доступна на сайте https://tssdk.elma365.com.
**/
async function CreatePositions(): Promise<void> {
    let orgs = await Context.fields.orgstructure.app.search().where(f => f.__deletedAt.eq(null)).size(1000).all();
    let emps = await Context.fields.employees.app.search().where(f => f.__deletedAt.eq(null)).size(10000).all();
    let tree = await System.organisationStructure.fetchTree();

    let parent = tree.getRoot();

    await CreateChildPositions(orgs, emps, parent);

    let errs = await System.organisationStructure.save(tree);
    if (errs.length === 0) {
        // Успешно сохранено
    } else {
        throw new Error(errs[0].desc)
    }
}

async function CreateChildPositions(
    orgs: BaseApplicationItem<Application$n1c_mdm_debug$orgstructure$Data, Application$n1c_mdm_debug$orgstructure$Params>[],
    emps: BaseApplicationItem<Application$n1c_mdm_debug$employees$Data, Application$n1c_mdm_debug$employees$Params>[],
    parent: OrganisationStructureItem
): Promise<void> {
    let childrenPositions = parent.getChildren();

    for (let childPosition of childrenPositions) {
        await CreateChildPositions(orgs, emps, childPosition);
        if (childPosition.isPosition()) {
            let org = orgs.filter(f => (f.data.head_person_pos_elma == childPosition.id)).pop();
            if (org) {
                let empList = emps.filter(e => (e.data.department_id_1c == org!.data.department_id_1c));
                let nameMap: Map<string, string> = new Map();
                for (let emp of empList) {
                    let mapValue = nameMap.get(emp.data.position!);
                    if (mapValue) {
                        emp.data.pos_elma = mapValue;
                        await emp.save();
                    } else {
                        if (emp.data.snils == org.data.head_person_id_1c) {
                            childPosition.data.name = emp.data.positin;
                            nameMap.set(emp.data.position!, childPosition.id);
                            emp.data.pos_elma = childPosition.id;
                            await emp.save();
                        } else {
                            let newItem = System.organisationStructure.createItem(emp.data.position!, OrganisationStructureItemType.Group);
                            childPosition.addChild(newItem);
                            nameMap.set(emp.data.position!, newItem.id);
                            emp.data.pos_elma = newItem.id;
                            await emp.save();
                        }
                    }
                }
            }
        }
    }
}

