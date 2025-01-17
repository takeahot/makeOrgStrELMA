/*
Здесь вы можете написать скрипты для сложной серверной обработки контекста во время выполнения процесса.
Для написания скриптов используйте TypeScript (https://www.typescriptlang.org).
Документация TS SDK доступна на сайте https://tssdk.elma365.com.
*/

// Название: OrgStructure, Код: orgstructure, Тип: Приложение, Подтип: Один (OrgStructure (раздел 1С MDM)), Полнотекстовый поиск: Нет, Сортировка: Нет
// Название: Organizations, Код: organizations, Тип: Приложение, Подтип: Один (Organizations (раздел 1С MDM)), Полнотекстовый поиск: Нет, Сортировка: Нет

async function CreateOrgStructure(): Promise<void> {
    // страхуемся на случай если элементов будет больше 1000, но ничего с этим дальше не делаем, просто не упадёт скрипт
    let orgs = await Context.fields.orgstructure.app.search().where(f => f.__deletedAt.eq(null)).size(1000).all();
    let orgItems = await System.organisationStructure.search().where(f => f.__deletedAt.eq(null)).size(1000).all();

    const tree = await System.organisationStructure.fetchTree();
    let root = tree.getRoot();
    await CreateChildDepartments('', root, tree, orgs, orgItems);
    await System.organisationStructure.save(tree);
}

async function CreateChildDepartments(
    parent_department_id_1c: string,
    root: OrganisationStructureItem,
    tree: OrganisationStructureTree,
    orgs: BaseApplicationItem<Application$n1c_mdm_debug$orgstructure$Data, Application$n1c_mdm_debug$orgstructure$Params>[],
    orgItems: OrganisationStructureItem[]
): Promise<void> {
    // получаем список дочерних организаций
    let childOrgs = orgs.filter(f => (f.data.parent_department_id_1c == parent_department_id_1c));
    for (let child of childOrgs) {
        let item: OrganisationStructureItem | undefined;
        let head: OrganisationStructureItem | undefined;
        if (child.data.department_id_elma && child.data.department_id_elma != '') {
            let ouItems = orgItems.filter(f => f.data.__id == child.data.department_id_elma!);
            if (ouItems.length > 0) {
                item = ouItems[0];
            }
        }
        if (child.data.head_person_pos_elma && child.data.head_person_pos_elma != '') {
            let ouItems = orgItems.filter(f => f.data.__id == child.data.head_person_pos_elma!);
            if (ouItems.length > 0) {
                head = ouItems[0];
            }
        }
        if (item === undefined) {
            item = System.organisationStructure.createItem(child.data.__name, OrganisationStructureItemType.Department);
            head = System.organisationStructure.createItem('Руководитель ' + child.data.__name, OrganisationStructureItemType.Position);
            root.addChild(item);
            item.addChild(head);
            child.data.department_id_elma = item.data.__id;
            child.data.head_person_pos_elma = head.data.__id;
            await child.save();
        } else {
            if (head === undefined) {
                head = System.organisationStructure.createItem('Руководитель ' + child.data.__name, OrganisationStructureItemType.Position);
                item.addChild(head);
                child.data.head_person_pos_elma = head.data.__id;
                await child.save();
            }
            if (item.getParent() != root) {
                item.moveToParent(root);
            }
        }
        if (child.data.department_id_1c && child.data.department_id_1c != '')
            await CreateChildDepartments(child.data.department_id_1c, head, tree, orgs, orgItems);
    }
}
