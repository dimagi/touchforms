function confirmSubmit(text)
{  
    if (text == null) 
       text = "Are you sure you wish to continue?";
    var agree = confirm(text);
    if (agree)
        return true ;
    else
        return false ;
}