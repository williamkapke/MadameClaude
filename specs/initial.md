In this project, we're going to create:

/stdio2http
This will be small deno app that takes the message from stdio and POSTS them to a HTTP server (see server below) on localhost. The app will start up. take the data from stdio- POST it, and exit.
Include unit tests.

/server
This will be a deno app that recieves the POST messages and streams them via websocket to a UI.
An initial development will include simpily writing the incomming messages to the console.

/ui
This will be a SIMPLE single page that displays the incomming messages to the server.
We will iterate on this app after we get to this point.


Create a README in the root that discribes the project, has mermaid diagrams, and how to add the stdio2http to the hooks config.

These should be built in the order list here.

Start with creating a development checklist with a numbered breakdown of the steps in /specs/todo.md
