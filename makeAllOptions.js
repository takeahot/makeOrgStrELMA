const fs = require('fs');

function generateTableCSV(optionsCSV) {
    // Разбиваем входные данные на массивы
    const options = optionsCSV.split('\n').map(row => row.split(',').map(opt => opt.trim()));

    // Функция для генерации всех комбинаций
    function generateCombinations(arrays, prefix = []) {
        if (!arrays.length) return [prefix];
        const [first, ...rest] = arrays;
        return first.flatMap(option => generateCombinations(rest, [...prefix, option]));
    }

    // Функция для порционной обработки комбинаций
    function processCombinationsInChunks(combinations, chunkSize, callback, done) {
        let index = 0;
        function processChunk() {
            const chunk = combinations.slice(index, index + chunkSize);
            chunk.forEach(row => callback(row));
            index += chunkSize;
            if (index < combinations.length) {
                setTimeout(processChunk, 0); // Микрозадержка перед обработкой следующей порции
            } else {
                done(); // Вызываем callback по завершении обработки всех порций
            }
        }
        processChunk();
    }

    // Генерируем все комбинации
    const combinations = generateCombinations(options);

    // Преобразуем в CSV-строку и сохраняем в файл порциями
    const csvFile = fs.createWriteStream('combinations.csv');
    processCombinationsInChunks(combinations, 1000, (row) => {
        const csvRow = row.join(",");
        csvFile.write(csvRow + '\n');
    }, () => {
        csvFile.end(); // Закрываем файл по завершении записи
        console.log('CSV файл успешно создан.');
    });
}

// Пример использования
const optionsCSV = `"Есть в сообщении эдо id elma","Нет в сообщении эдо id elma"
"Найден договор в elma по id elma или id 1c из сообщения эдо","Не найден договор в elma по id elma или id 1c из сообщения эдо"
"Найден дс в elma по id elma или id 1c из сообщения эдо","Не найден дс в elma по id elma или id 1c из сообщения эдо"
"Создан в 1С элемент ЗД связанный с сообщением ЭДО","Не создан в 1С элемент ЗД связанный с сообщением ЭДО"
"Есть ЗД в ELMA с таким же ID ЭДО и id файла","Нет ЗД в ELMA с таким же ID ЭДО и id файла"
"Найден ЗД","Не найден ЗД (был удалён случайно)"
"есть связка с предыдущими id_edo и совпадает с id_файла в эелементе 1с","Нет связки с предыдущими id_edo и  совпадающим id_файла в эелементе 1с"
"Есть с чем сопоставить в ELMA","Надо создать с чем сопоставить в ELMA","Ошибочный тип","Не требуется сопоставление (файл не актуален)"
"Есть элемент ELMA с предыдущими id edo и id файла","Нет элемента ELMA с предыдущими id edo и id файла"`;

generateTableCSV(optionsCSV);
