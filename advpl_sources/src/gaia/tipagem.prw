#include "protheus.ch"

user function inferType()
    local nI := 1 as numeric
    local nMax  
    local lWait  
    local xVar 
    local jJson
    local iCont
    local dCont
    local fCont
    local dDate
    local aArray
    local oObj
    local bBlock


    for nI := 1 to nMax
        startJob("u_myCustomJob",getenvserver(),lWait, "Thread " + cValToChar(nI), nI)
    next nI
return
