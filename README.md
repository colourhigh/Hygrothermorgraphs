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

    temp 10 100 # will hold at 10 degrees at next lowest temp_map temperature for 10 min
    temp_tween 1 10 50 # will tween between 1 degree and 10 degrees over 50 minutes

    letter A # will draw 'A', as defined in alphabet object.  starts 'low'.
    word AHL # will draw 'AHL' as defined in alphabet.  If letter ends 'high' but next starts 'low' will throw error.  starts 'low'.

-------------------
Last updates:
* Added functions
* Added source maps for debugging and current position
* Added tween, generates code for on1, off1, off1, on2, number_steps
* Added loops, calls functions x number of times:  loop my_func 13
* Added temp and temp tweens, temp_map
* Added letter and word support