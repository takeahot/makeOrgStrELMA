/**
Here you can write scripts for complex server processing of the context during process execution.
To write scripts, use TypeScript (https://www.typescriptlang.org).
ELMA365 SDK documentation available on https://tssdk.elma365.com.
**/

async function publishToCorresp(): Promise<void> {
    let personMDMList = await Context.fields.persons.app.search().where((f, g) => g.and(f.__deletedAt.eq(null), f.inn.neq(null))).size(10000).all();
    let personCorrespList = await Context.fields.fizicheskie_lica.app.search().where((f, g) => g.and(f.__deletedAt.eq(null))).size(10000).all();

    while (true) {
        let personMDM = personMDMList.pop();
        if (personMDM) {
            let personCorresp = personCorrespList.filter(f=>(f.data.inn == personMDM!.data.inn));
            if (personCorresp.length > 0) {
                //TODO: update
            } else {
                let newPersonCorresp = await Context.fields.fizicheskie_lica.app.create();
                newPersonCorresp.data.inn = personMDM!.data.inn;
                newPersonCorresp.data.full_name = {firstname: personMDM!.data.first_name ?? '', lastname: personMDM!.data.last_name ?? '', middlename: personMDM!.data.second_name ?? ''};
                await newPersonCorresp.save();
            }
        } else {
            return;
        }
    }
}