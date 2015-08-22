Contributing
------------

Thanks for wanting to contribute to this project !

## Pull requests
Please pull request on the `develop` branch, pull requests on `master` will not be merged. The `master` branch represents the state of the extension on the chrome webstore.

## Coding guidelines

### Indentation
The Indent should be 2 spaces.

### Maximum line length
The maximum line length of a line should be 120 characters.

### Variable declarations
Several variable declarations should be indented of two spaces:

```js
var
  un = 1,
  dos = 2,
  tres = 3;
```

### Semicolons
Always use semicolons and never rely in implicit insertion.

### Quotes
Quote strings with `'`. Don't use `"`.

### Constants
Should be declared in upper case.
```JS
var CONTANT_1 = 10;
```
### Equality
Use the `===` and `!==` operators. The `==` and `!=` operators do type coercion and should not be used.

### Errors
When you when to throw an error, NEVER throw something else than an error.

```JavaScript
throw new Error('description')
```

### Commenting your code
 Use `JSDoc` to format JavaScript comments. [Read the docs](http://usejsdoc.org/index.html).
 
