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
    tween 1 10 14 30 100
    loop test2 10

-------------------
Last updates:
* Added functions
* Added source maps for debugging and current position
* Added tween, generates code for on1, off1, off1, on2, number_steps
* Added loops, calls functions x number of times:  loop my_func 13
