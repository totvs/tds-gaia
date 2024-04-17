#include "protheus.ch"

user function manyProcess()
	local jobNum := 1

	while jobNum < 30
		conout(">> Chamando job " + strZero(jobNum, 2))
		startJob("u_job", "p12133", .f., jobNum)
		jobNum++
	enddo

return

user function job(seq)
	local start := seconds()

	conout(">> Iniciei job " + strZero(seq, 2))

	while (seconds() - start < 100)
		sleep(1000)
		conout(">> Processando  " + strZero(seq, 2) + " " + time())
	enddo

	conout(">> Terminei job " + strZero(seq, 2))
return
