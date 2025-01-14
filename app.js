async function createOrganisationStructure(data) {
    const tree = await System.organisationStructure.fetchTree();
    const root = tree.getRoot();

    const itemsMap = new Map();
    const positionsMap = new Map();

    // Первый проход: создание всех элементов
    for (const department of data) {
        const item = System.organisationStructure.createItem(department.department_name, OrganisationStructureItemType.Department);
        itemsMap.set(department.department_id_1c, item);

        // Создание элемента типа "POSITION" на основе данных о руководителе
        if (department.head_person_id_1c) {
            const positionItem = System.organisationStructure.createItem(department.head_person_id_1c, OrganisationStructureItemType.Position);
            item.addChild(positionItem);
            positionsMap.set(department.department_id_1c, positionItem);
        }
    }

    // Второй проход: установка родительских связей
    for (const department of data) {
        const item = itemsMap.get(department.department_id_1c);
        if (department.parent_department_id_1c) {
            const parentPosition = positionsMap.get(department.parent_department_id_1c);
            if (parentPosition) {
                parentPosition.addChild(item);
            } else {
                // Если у родительского департамента нет руководителя, добавляем департамент к корню
                root.addChild(item);
            }
        } else {
            root.addChild(item);
        }
    }

    // Третий проход: установка корневого элемента в качестве родителя для элементов без родителя
    for (const department of data) {
        const item = itemsMap.get(department.department_id_1c);
        if (!item.parent) {
            root.addChild(item);
        }
    }

    const errs = await tree.validate();
    if (errs.length > 0) {
        Context.data.errors = errs.join(', ');
    } else {
        Context.data.errors = 'Оргструктура составлена правильно';
        await System.organisationStructure.save(tree);
    }
}

// Пример данных JSON
const data = [
    {
        "company_id_1c": "4b668f9b-2e1f-11e6-80fc-000c29cf9e20",
        "parent_department_id_1c": "",
        "department_id_1c": "4b668f9b-2e1f-11e6-80fc-000c29cf9e20",
        "department_name": "ГОРОДСКИЕ СЕРВИСЫ ООО",
        "head_person_id_1c": "",
        "date_start": "",
        "date_end": "",
        "source_1c_id": "integrator",
        "show_on_portal": false,
        "cfo_id_1c": ""
    },
    {
        "company_id_1c": "4b668f9b-2e1f-11e6-80fc-000c29cf9e20",
        "parent_department_id_1c": "4b668f9b-2e1f-11e6-80fc-000c29cf9e20",
        "department_id_1c": "475914c9-8575-11ea-817c-000c29cf9e20",
        "department_name": "Администрация",
        "head_person_id_1c": "",
        "date_start": "2020-04-01",
        "date_end": "",
        "source_1c_id": "integrator",
        "show_on_portal": false,
        "cfo_id_1c": "eed194af-d7aa-11ed-a4a8-005056bfad63"
    },
    {
        "company_id_1c": "4b668f9b-2e1f-11e6-80fc-000c29cf9e20",
        "parent_department_id_1c": "4b668f9b-2e1f-11e6-80fc-000c29cf9e20",
        "department_id_1c": "6767fe90-74a3-11ed-81c2-005056867252",
        "department_name": "Дирекция по технологиям",
        "head_person_id_1c": "071-526-484 58",
        "date_start": "2022-12-01",
        "date_end": "",
        "source_1c_id": "integrator",
        "show_on_portal": false,
        "cfo_id_1c": "eed194af-d7aa-11ed-a4a8-005056bfad63"
    }
];

// Вызов функции с данными JSON
createOrganisationStructure(data);