type SearchableField = {
    __deletedAt: {
        eq: (value: any) => any;
    };
};

type SearchableApp = {
    search: () => {
        where: (predicate: (f: SearchableField) => any) => {
            sort: (field: string) => {
                from: (value: number) => {
                    size: (value: number) => {
                        all: () => Promise<any[]>;
                    };
                };
            };
            size: (value: number) => {
                all: () => Promise<any[]>;
            };
        };
    };
};

type ContextData = {
    iter?: number;
    json_string?: string;
    elementscount?: number;
    updatecomplete?: boolean;
    debugstring?: string;
};

type ContextType = {
    fields: {
        orgstructure: {
            app: SearchableApp;
        };
        organizations: {
            app: {
                search: () => {
                    where: (predicate: (f: SearchableField) => any) => {
                        sort: (field: string) => {
                            from: (value: number) => {
                                size: (value: number) => {
                                    all: () => Promise<any[]>;
                                };
                            };
                        };
                    };
                };
                create: () => Promise<any>;
            };
        };
        log: {
            app: {
                search: () => {
                    where: (predicate: (f: SearchableField) => any) => {
                        sort: (field: string) => {
                            from: (value: number) => {
                                size: (value: number) => {
                                    all: () => Promise<any[]>;
                                };
                            };
                        };
                    };
                };
                create: () => Promise<any>;
            };
        };
        OrgStructure: {
            app: SearchableApp;
        };
    };
    data: ContextData;
};

type SystemType = {
    organisationStructure: {
        search: () => {
            where: (predicate: (f: SearchableField) => any) => {
                size: (value: number) => {
                    all: () => Promise<any[]>;
                };
            };
        };
        fetchTree: () => Promise<OrganisationStructureTree>;
        save: (tree: OrganisationStructureTree) => Promise<void>;
        createItem: (name: string, type: OrganisationStructureItemType) => OrganisationStructureItem;
    };
};

type OrganisationStructureItem = {
    data: {
        __id: string;
        __name: string;
        department_id_elma?: string;
        head_person_pos_elma?: string;
        parent_department_id_1c?: string;
        department_id_1c?: string;
    };
    addChild: (item: OrganisationStructureItem) => void;
    moveToParent: (parent: OrganisationStructureItem) => void;
    getParent: () => OrganisationStructureItem | null;
};

type OrganisationStructureTree = {
    getRoot: () => OrganisationStructureItem;
    validate: () => Promise<string[]>;
};

type BaseApplicationItem<TData, TParams> = {
    data: TData;
    save: () => Promise<void>;
};

type Application$n1c_mdm_debug$orgstructure$Data = {
    __name: string;
    department_id_elma?: string;
    head_person_pos_elma?: string;
    parent_department_id_1c?: string;
    department_id_1c?: string;
};

type Application$n1c_mdm_debug$orgstructure$Params = {};

type OrgStructureField = {
    __deletedAt: {
        eq: (value: any) => any;
    };
};

enum OrganisationStructureItemType {
    Department = 'DEPARTMENT',
    Position = 'POSITION',
}

class Datetime {
    createdAt: Date;
    updatedAt: Date;

    constructor() {
        const now = new Date();
        this.createdAt = now;
        this.updatedAt = now;
    }
}

type orgData = {
    organization_id_1c: string;
    organization_name: string;
    organization_name_full: string;
    organization_name_small: string;
    inn: string;
    kpp: string;
    okpo: string;
    ogrn: string;
    typeact: string;
    orgform: string;
    company_id_1c?: string;
    parent_department_id_1c?: string;
    department_id_1c?: string;
    department_name?: string;
    head_person_id_1c?: string;
    date_start?: string;
    date_end?: string;
    source_1c_id?: string;
    show_on_portal?: boolean;
    cfo_id_1c?: string;
};

type FetchRequest = {
    method: string;
    headers: {
        'Authorization': string;
    };
};

declare const Context: ContextType;
declare const System: SystemType;
declare const Namespace: any;

const batchSize = 30;

// type orgData = {
//     organization_id_1c: string;
//     organization_name: string;
//     organization_name_full: string;
//     organization_name_small: string;
//     inn: string;
//     kpp: string;
//     okpo: string;
//     ogrn: string;
//     typeact: string;
//     orgform: string;
//     company_id_1c?: string;
//     parent_department_id_1c?: string;
//     department_id_1c?: string;
//     department_name?: string;
//     head_person_id_1c?: string;
//     date_start?: string;
//     date_end?: string;
//     source_1c_id?: string;
//     show_on_portal?: boolean;
//     cfo_id_1c?: string;
// };

// const batchSize = 30;

// type OrganisationStructureItem = {
//     data: {
//         __id: string;
//         __name: string;
//         department_id_elma?: string;
//         head_person_pos_elma?: string;
//         parent_department_id_1c?: string;
//         department_id_1c?: string;
//     };
//     addChild: (item: OrganisationStructureItem) => void;
//     moveToParent: (parent: OrganisationStructureItem) => void;
//     getParent: () => OrganisationStructureItem | null;
// };

// type OrganisationStructureTree = {
//     getRoot: () => OrganisationStructureItem;
//     validate: () => Promise<string[]>;
// };

// type BaseApplicationItem<TData, TParams> = {
//     data: TData;
//     save: () => Promise<void>;
// };

// type Application$n1c_mdm_debug$orgstructure$Data = {
//     __name: string;
//     department_id_elma?: string;
//     head_person_pos_elma?: string;
//     parent_department_id_1c?: string;
//     department_id_1c?: string;
// };

// type Application$n1c_mdm_debug$orgstructure$Params = {};

// type OrgStructureField = {
//     __deletedAt: {
//         eq: (value: any) => any;
//     };
// };

// enum OrganisationStructureItemType {
//     Department = 'DEPARTMENT',
//     Position = 'POSITION',
// }

