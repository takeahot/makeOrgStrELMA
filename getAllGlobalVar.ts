async function collectContextProperties(): Promise<void> {
    function getAllPropertyNames(obj: object): string[] {
        let props: string[] = [];

        do {
            props = props.concat(Object.getOwnPropertyNames(obj));
            obj = Object.getPrototypeOf(obj);
        } while (obj && obj !== Object.prototype);

        return props;
    }

    // Пример использования
    const contextProperties = getAllPropertyNames(Context);
    console.log(contextProperties);
}

