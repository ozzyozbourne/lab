
proc test {name code {okpattern undefined} {tags {}}} {
    # abort if test name in skiptests
    # so this for skipping 
    if {[search_pattern_list $name $::skiptests]} {
        incr ::num_skipped
        send_data_packet $::test_server_fd skip $name
        return
    }

    # this for verbose ?
    if {$::verbose > 1} {
        puts "starting test $name"
    }

    # abort if only_tests was set but test name is not included
    if {[llength $::only_tests] > 0 && ![search_pattern_list $name $::only_tests]} {
        incr ::num_skipped
        send_data_packet $::test_server_fd skip $name
        return
    }

    set old_singledb $::singledb
    set tags [concat $::tags $tags]
    if {![tags_acceptable $tags err]} {
        incr ::num_aborted
        send_data_packet $::test_server_fd ignore "$name: $err"
        return
    }

    if {[lsearch $tags singledb] >= 0} {
        set ::singledb 1
    }
    incr ::num_tests
    set details {}
    lappend details "$name in $::curfile"

    # set a cur_test global to be logged into new servers that are spawn
    # and log the test name in all existing servers
    set prev_test $::cur_test
    set ::cur_test "$name in $::curfile"
    if {$::external} {
        catch {
            set r [valkey [srv 0 host] [srv 0 port] 0 $::tls]
            catch {
                $r debug log "### Starting test $::cur_test"
            }
            $r close
        }
    } else {
        set servers {}
        foreach srv $::servers {
            set stdout [dict get $srv stdout]
            set fd [open $stdout "a+"]
            puts $fd "### Starting test $::cur_test"
            close $fd
            lappend servers $stdout
        }
        if {$::verbose > 1} {
            puts "### Starting test $::cur_test - with servers: $servers"
        }
    }

    send_data_packet $::test_server_fd testing $name

    set test_start_time [clock milliseconds]
    if {[catch {set retval [uplevel 1 $code]} error]} {
        set assertion [string match "assertion:*" $error]
        if {$assertion || $::durable} {
            # durable prevents the whole tcl test from exiting on an exception.
            # an assertion is handled gracefully anyway.
            set msg [string range $error 10 end]
            lappend details $msg
            if {!$assertion} {
                lappend details $::errorInfo
            }
            lappend ::tests_failed $details

            incr ::num_failed
            send_data_packet $::test_server_fd err [join $details "\n"]

            if {$::exit_on_failure} {
                puts "Test error (last server port:[srv port], log:[srv stdout]), test will exit now"
                flush stdout
                exit 1
            }
            if {$::stop_on_failure} {
                puts "Test error (last server port:[srv port], log:[srv stdout]), press enter to teardown the test."
                flush stdout
                gets stdin
            }
        } else {
            # Re-raise, let handler up the stack take care of this.
            error $error $::errorInfo
        }
    } else {
        if {$okpattern eq "undefined" || $okpattern eq $retval || [string match $okpattern $retval]} {
            incr ::num_passed
            set elapsed [expr {[clock milliseconds]-$test_start_time}]
            send_data_packet $::test_server_fd ok $name $elapsed
        } else {
            set msg "Expected '$okpattern' to equal or match '$retval'"
            lappend details $msg
            lappend ::tests_failed $details

            incr ::num_failed
            send_data_packet $::test_server_fd err [join $details "\n"]
        }
    }

    if {$::traceleaks} {
        set output [exec leaks valkey-server]
        if {![string match {*0 leaks*} $output]} {
            send_data_packet $::test_server_fd err "Detected a memory leak in test '$name': $output"
        }
    }
    set ::singledb $old_singledb
    set ::cur_test $prev_test
}

proc test {descr code} {
    set ts [clock format [clock seconds] -format %H:%M:%S]
    puts -nonewline "$ts> $descr: "
    flush stdout

    if {[catch {set retval [uplevel 1 $code]} error]} {
        incr ::failed
        if {[string match "assertion:*" $error]} {
            set msg "FAILED: [string range $error 10 end]"
            puts [colorstr red $msg]
            if {$::pause_on_error} pause_on_error
            puts [colorstr red "(Jumping to next unit after error)"]
            return -code continue
        } else {
            # Re-raise, let handler up the stack take care of this.
            error $error $::errorInfo
        }
    } else {
        puts [colorstr green OK]
    }
}

proc start_cluster {
    masters 
    replicas 
    options 
    code 
    {slot_allocator continuous_slot_allocation} 
    {replica_allocator default_replica_allocation}
    } {
    set node_count [expr $masters + $replicas]

    # Set the final code to be the tests + cluster setup
    set code [list cluster_setup $masters $replicas $node_count $slot_allocator $replica_allocator $code]

    # Configure the starting of multiple servers. Set cluster node timeout
    # aggressively since many tests depend on ping/pong messages. 

    set cluster_options [list overrides [list cluster-enabled yes cluster-ping-interval 100 cluster-node-timeout 3000 cluster-databases 16 cluster-slot-stats-enabled yes]]
    set options [concat $cluster_options $options]

    # Cluster mode only supports a single database, so before executing the tests
    # it needs to be configured correctly and needs to be reset after the tests. 
    set old_singledb $::singledb
    set ::singledb 1
    start_multiple_servers $node_count $options $code
    set ::singledb $old_singledb
}

# 1st param is master nodes to create 
# 2nd param is replica nodes to create 
# 3rd param is the option passed 
# 4th param is the code itself 
#
