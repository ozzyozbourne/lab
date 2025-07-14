proc innerProc {} {
    error "Something went wrong!"
}

proc middleProc {} {
    innerProc
}

proc outerProc {} {
    middleProc
}

# Call the outer procedure and catch any error
if {[catch {outerProc} errorMsg]} {
    puts "Error message: $errorMsg"
    puts "\nFull stack trace:"
    puts $::errorInfo
}
