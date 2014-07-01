Hygrothermorgraphs
==================

Current language supports the following:

    func test1
       on 1
       off 2
    end
    func test2
       on 3
       off 2
       call test1
    end
    call test1
    call test2

And a silly hacked version of source mapping (is just the pc/2, so not quite right).


Next will add conditionals, inc, decr and loops, and probably a source map.  
Then add easing.  Then make a graphical front end for script.  
