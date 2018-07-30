let fs = require('fs');

(function() {
        
    // read fk6_1 metadata
    const FK6_1_HEADER = 'Byte-by-byte Description of file: fk6_1.dat';
    const FK6_1_STRUCTURE = {
        START : [0,4],
        END : [5, 8],
        FORMAT : [8, 16],
        UNITS : [16, 23],
        LABEL : [23, 35],
        EXPLANATION : [35, 80]
    }
    let data = fs.readFileSync( 'public/FK6/ReadMe', {encoding : 'ascii'} );
    let lines = data.split('\n');
    let index = findLine( FK6_1_HEADER );
    let full_metadata = parseMetadata(lines, index+4, FK6_1_STRUCTURE)

    // filter catalog metadata so we don't grab all the stuff we don't need...
    const filter = ['FK6', 'Name', 
            'RAh', 'RAm', 'RAs', 'e_RA*',
            'TRA', 'pmRA*', 'e_pmRA*',
            'DE-', 'DEd', 'DEm', 'DEs', 'e_DEs',
            'TDE','pmDE', 'e_pmDE',
            'plx', 'e_plx', 'RV',
            'Vmag', 'f_Vmag', 'Kae', 'Note'];
    let metadata=[];
    full_metadata.forEach( function(field) {
        let index = filter.findIndex( (d)=>(d==field.LABEL) ) ;
        if (index>-1) metadata[index] = field; // preserve the field order in the filter
    });
    //metadata = metadata.filter( field => filter.includes(field.LABEL) ); // this method preserves raw order...
    console.log( 'FK6_1.dat metadata from readme' );
    console.log(metadata);

    // read fk6_1 data
    data = fs.readFileSync('public/FK6/fk6_1.dat', {encoding:'ascii'} );
    lines = data.split('\n');
    let catalog = parseData(lines, metadata);
    // console.log(catalog);
    //TODO we got a null record at the end...
    
    // map to json objects and write to a json file
    let stars = mapData(filter, catalog);
    fs.writeFileSync('public/stars.json', JSON.stringify(stars, null, 2));

    // rather than just writing to the json format I want, maybe I could stuff it in some database...
    // rather than reading everything into memory then processing, might want to convert this to a streaming process...

    function findLine (content) {
        let index = 0;
        while (index < lines.length) {
            if (lines[index] == content)
                break;
            else index++;
        }
        return index;
    }

    function parseMetadata (lines, index, structure) {
        const SEPARATOR = '--------------------------------------------------------------------------------';
        let metadata = [];
        
        // read every line until the separator
        while (lines[index]!==SEPARATOR) {
            let line = lines[index];

            if (SEPARATOR==line)
                break;

            // parse field description
            let description = {};
            for( let field in structure ) {
                let bounds = structure[field];
                let value = line.slice( bounds[0], bounds[1] ).trim();
                description[field] = value;
            } // Object.keys(FK6_DAT).map(e=>description[e] = line.slice(structure[e][0], structure[e][1]).trim() );

            // add the field
            if (description.END!='')
                metadata.push( description );

            // if fields are missing it is an addendum to the explanation
            else
                metadata[metadata.length-1].EXPLANATION.concat(description.EXPLANATION); 
            
            index++;
        }
        return metadata;
    }

    function parseData (lines, metadata) {
        let stars = []
        for (let line of lines) {
            let star = [];
            for(let field of metadata) {
                let value;
                if (field.START)
                    value = line.slice(field.START-1, field.END).trim();
                else value = line.slice(field.END-1, field.END).trim();

                if (field.FORMAT[0]=='I')
                    value = parseInt( value );
                else if (field.FORMAT[0]=='F')
                    value = parseFloat( value );
                
                star.push( value );
            }
            stars.push(star);
        }
        return stars;
    }

    function mapData( fieldNames, catalog ) {
        let stars = [];
        for (let entry of catalog) {
            let star = {};
            for(let n in fieldNames)
                star[ fieldNames[n] ] = entry[n];
            stars.push( star );
            //{ magnitude : entry[ fieldNames.findIndex(d => d=='Vmag') ] }
        }
        return stars;
    }

}());
// const FK6_COLUMNS = 843;

// fs.readFile( 'public/FK6/fk6_1.dat', function( error, data) {
//     if (error) throw error;
//     const FK6_ROWS = data.length / FK6_COLUMNS;

//     if(Buffer.isBuffer(data)) {
//         console.log( FK6_COLUMNS+','+FK6_ROWS );
//     }
// } );