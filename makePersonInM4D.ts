/**
Here you can write scripts for complex server processing of the context during process execution.
To write scripts, use TypeScript (https://www.typescriptlang.org).
ELMA365 SDK documentation available on https://tssdk.elma365.com.
**/

async function publishToM4D(): Promise<void> {
    let personMDMList = await Context.fields.persons.app.search().where((f, g) => g.and(f.__deletedAt.eq(null), f.inn.neq(null))).size(10000).all();
    let personCorrespList = await Context.fields.fizicheskoe_lico.app.search().where((f, g) => g.and(f.__deletedAt.eq(null))).size(10000).all();

    while (true) {
        let personMDM = personMDMList.pop();
        if (personMDM) {
            let personCorrespArray = personCorrespList.filter(f=>(f.data.ext_str_8 == personMDM!.data.person_id_1c));
            if (personCorrespArray.length > 0) {
                let personCorresp = personCorrespArray[0];
                personCorresp.data.ext_str_8 = personMDM!.data.person_id_1c;
                personCorresp.data.imya = personMDM!.data.first_name;
                personCorresp.data.familiya = personMDM!.data.last_name;
                personCorresp.data.otchestvo = personMDM!.data.second_name;
                personCorresp.data.snils = personMDM!.data.snils;
                if (personMDM!.data.birth_date)
                {
                    let bdArr = personMDM!.data.birth_date.split('-');
                    if (bdArr.length == 3)
                    {
                        let year = Number.parseInt(bdArr[0]);
                        let month = Number.parseInt(bdArr[1]);
                        let day = Number.parseInt(bdArr[2]);
                        personCorresp.data.data_rozhd = new TDate(year, month, day);
                    }
                }
                personCorresp.data.pol = (personMDM!.data.gender == 'Ж') ? personCorresp.fields.pol.data.variants.find(f => f.code === '2') as TEnum<Enum$mchd_new$fizlico$pol> : 
                personCorresp.fields.pol.data.variants.find(f => f.code === '1') as TEnum<Enum$mchd_new$fizlico$pol>;;

                await personCorresp.save();
            } else {
                let newPersonCorresp = await Context.fields.fizicheskoe_lico.app.create();
                newPersonCorresp.data.ext_str_8 = personMDM!.data.person_id_1c;
                newPersonCorresp.data.imya = personMDM!.data.first_name;
                newPersonCorresp.data.familiya = personMDM!.data.last_name;
                newPersonCorresp.data.otchestvo = personMDM!.data.second_name;
                newPersonCorresp.data.snils = personMDM!.data.snils;
                if (personMDM!.data.birth_date)
                {
                    let bdArr = personMDM!.data.birth_date.split('-');
                    if (bdArr.length == 3)
                    {
                        let year = Number.parseInt(bdArr[0]);
                        let month = Number.parseInt(bdArr[1]);
                        let day = Number.parseInt(bdArr[2]);
                        newPersonCorresp.data.data_rozhd = new TDate(year, month, day);
                    }
                }
                newPersonCorresp.data.pol = (personMDM!.data.gender == 'Ж') ? newPersonCorresp.fields.pol.data.variants.find(f => f.code === '2') as TEnum<Enum$mchd_new$fizlico$pol> : 
                newPersonCorresp.fields.pol.data.variants.find(f => f.code === '1') as TEnum<Enum$mchd_new$fizlico$pol>;

                await newPersonCorresp.save();
            }
        } else {
            return;
        }
    }
}
