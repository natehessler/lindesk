# Command Line Generator

A web app that generates the most frequently used commands for different deployment type when supporting a customer.

<img width="1195" alt="clg" width="100%" src="https://user-images.githubusercontent.com/68532117/121770229-0008d100-cb1d-11eb-9a47-e81a4e1beb23.png">

[Link to App](https://sourcegraph.github.io/support-tools/command-generator/beta)

## Features

- generates command line based on selected deployment type, currently supports Docker, Docker Compose, K8s
- add/update namespace for K8s commands
- add/update name of pod for K8s commands
- add/update name of container for Docker commands

## How to use

1. Select Deployment Type
1. Select Function
1. Update namespace and/or name of pod if necessary
1. Copy auto-generated command line to use in terminal

## Future Plans

- unique url for a generated command to share with customers
- add container based on each k8s pod/service
- redesign layout
Hello World
