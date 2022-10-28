const csv = require('csv-parser')
const fs = require('fs');
const { Transform } = require('stream');
const results = [];

fs.createReadStream('./work/IMPOWRREDCapLibrary_DataDictionary_2022-10-23.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    let csvRowCount = 0
    let map = []
    for(let item of results){
        if(item['Form Name'] == 'impowr_demographics'){
            csvRowCount++
            console.log(item)
            // console.log(item['Field Label'])
            // console.log(item.concept_id)
            map.push(transform(item))
        }
        
    }
    console.log(map)
    console.log('Total records', csvRowCount)
    // console.log(results[0]['Form Name']);

  });

  function transform(item){
        return {
            "Variable / Field Name": item['Variable / Field Name'],
            "Field Label": item['Field Label'],
            "Concept IDs": item['concept_id'].split('\n'),
            "Field Annotations": item['Field Annotation'].split(',')
        }

  }