import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintStream;
import java.nio.file.Files;
import java.nio.file.Path;

class PageBuilder {

    private static final int INPUT_FILES = 2;
    private static final String TEMPLATE_FILE = "../dist/template.html";
    private static final String SCRIPT_FILE = "../dist/main.js";
    private static final String OUTPUT_FILE = "output.html";

    public static void main(String[] args) {
        if (args.length < INPUT_FILES) {
            System.out.println("Arguments required: " + INPUT_FILES);
            return;
        }

        // Read from template into memory
        String templateStr;
        try {
            templateStr = Files.readString(Path.of(TEMPLATE_FILE));
        } catch (IOException e) {
            System.out.println("Error reading template");
            return;
        }

        String scriptStr;
        try {
            scriptStr = Files.readString(Path.of(SCRIPT_FILE));
        } catch (IOException e) {
            System.out.println("Error reading script file");
            return;
        }
        
        String dependenciesStr;
        String clusteringStr;
        try {
            dependenciesStr = Files.readString(Path.of(args[0]));
            clusteringStr = Files.readString(Path.of(args[1]));
        } catch (IOException e) {
            System.out.print("Unable to read input files");
            return;
        }

        templateStr = templateStr.replace("[[$DEPENDENCIES]]", dependenciesStr);
        templateStr = templateStr.replace("[[$CLUSTERING]]", clusteringStr);
        templateStr = templateStr.replace("[[$SCRIPT]]", scriptStr);

        try {
            PrintStream output = new PrintStream(OUTPUT_FILE);
            output.println(templateStr);
            System.out.println("Success!");
        } catch (FileNotFoundException e) {
            System.out.println("Error writing output");
        }
    }
}