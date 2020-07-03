# Install Address Book


> - A line break after a command for eg. `dao new $f`, this means you must create an environment variable, you can stores these in the block provided
> - Commands without line breaks can be run as pasted into the terminal together and run synchronously

Three permissions need to be created for the voting app to function properly

* `ADD_ENTRY_ROLE`
* `REMOVE_ENTRY_ROLE`
* `UPDATE_ENTRY_ROLE`


<br>

**Envoronment Variables**

```bash
f="--env aragon:rinkeby"
dao=
voting=
addressbook="NEW_ADDRESSBOOK_ADDRESS"
```

<br>

**Commands**

```bash
dao install $dao addressbook.aragonpm.eth $f

dao acl create $dao $addressbook ADD_ENTRY_ROLE $voting $voting $f
dao acl create $dao $addressbook REMOVE_ENTRY_ROLE $voting $voting $f
dao acl create $dao $addressbook UPDATE_ENTRY_ROLE $voting $voting $f
```