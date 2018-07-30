import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.util.ArrayList;

import static j2html.TagCreator.*;
import static org.eclipse.jetty.http.HttpParser.LOG;
import static spark.Spark.*;

public class Main {

    private static ArrayList<JSONObject> catalog = new ArrayList<>();

    // add get service path for retrieving catalog entries
    // add path for serving star browsing application...
    // Add get path for retrieving zenith position which employs native libraries
    public static void main(String[] args) {

        // set the server port
        port( 4567 ); // this is the default port anyways

        // get logging facade
        Logger logger = LoggerFactory.getLogger( Main.class );

        // determine the deployments root directory
        String root_directory = "";
        if( args.length>0 && args[0].equals("localhost") ) {
            String projectDir = System.getProperty("user.dir");
            String staticDir = "\\src\\main\\resources\\public";
            root_directory = projectDir + staticDir;
            staticFiles.externalLocation( root_directory );
        } else {
            root_directory = "/public";
            staticFiles.location("/public");
        }

        // load star catalog
        try {
            File file = new File( root_directory + "/stars.json" );
            assert( file.exists() );
            FileInputStream stream = new FileInputStream( file );
            JSONTokener tokenizer = new JSONTokener( stream );
            JSONArray array = new JSONArray( tokenizer );
            for (Object o:array)
                if( o instanceof JSONObject )
                    catalog.add( (JSONObject)o );
            logger.info( "Loaded star catalog" );

        } catch ( Exception exception ) {
            String msg = "Failed to load star catalog";
            logger.debug( msg, exception );
            halt(500, msg );
        } // use a real database to store the catalog

        get("/hello", (request, response) -> {

            String accept = request.headers("Accept");
            if( accept == null ) {
                response.status( 400 );
                logger.error("missing Accept headers");
                return "error.";
            }

            else if( accept.contains("text/html") ) {
                response.status(200);
                response.type("text/html");
                return html( body().with(
                        h1("FK 6 Star Catalog excerpt"),
                        each( catalog, entry ->
                                div(
                                        p(entry.toString())
                                )
                        )
                )).render();
            }

            else if( accept.contains("application/json") ) {
                response.status(200);

                return catalog.toString();
            }

            return "error";
        } );

        get( "/api/zenith", (request, response) -> {


            halt( 500, "Casey is lazy" );
            return null;
        } );
    }

}