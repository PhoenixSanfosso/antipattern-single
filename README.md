## Step 1: Bundle the code with Webpack

Use `npx webpack` or run the `build` script from npm.

## Step 2: Test the prototype

After our JavaScript is bundled, we can use the Java prototype tool 
to compile the template and our code, outputting an HTML file.

In the `builder` directory, run the Java application and include
two of the example JSON files to demonstrate.

Example:
`java PageBuilder example1-dep.json example1-clu.json`

Then, an `output.html` file will be generated. Open this to view
the resulting graph.
