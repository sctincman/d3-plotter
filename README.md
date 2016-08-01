# d3-plotter
Plot data using D3

These functions should help automate some of the more common but difficult things to add to charts: axes and scales.

`lineChart` takes a D3 selection and generates a chart, returning it as a closure in an *update* function, much like proposed [here](http://bost.ocks.org/mike/chart/) This function assumes an svg container and will store the whole chart in it's own group under the parent selection passed.

Configuration. Pass data in as either a single array of [x,y] points, or as an array of JSON objects. The JSON object allows fine tuning:
```
{
    "data": [[x1,y1], ...,[xn,yn]], //necessary
    "attr": {                       //optional, attr of parent group for this data
      "attr1": "value",
      ...             ,
      "attrn": "value"
      }
    "presentations": [rep1, rep2, ..., rep3], //how to show data, JSON object
                                                //optional, defaults to line+circles
}
```

Passing in just data does a single line+circles plot of the data using the class "data" from the parent group. In all cases, try to use sane/aesthetic defaults, group all elements into sensible groups, and class all groups. For example, circles use `cx=xscale, cy=yscale, r=constant`.

But, `attr` should allow one to override using anonymous functions: `{ "attr": { "r" = function(d) {return d} }}` to make circles scale radius.
so, 2/3?

```
// Data "presentation" JSON format
{
    "element": (any valid SVG element)
    "attr": {...}  // list of attr for element
    "style": {...} //manual style for element
    "stagger" : ?? //not implemented yet, allow stagger/stacking of data
                   //This is typically good for CV data in papers.
    //path attributes, x and y
    "path": {...}
}
```