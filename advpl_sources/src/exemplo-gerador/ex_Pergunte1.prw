
// basico: Crie uma funcão de usuário que execute a função Pergunte
// basico: Me de um exemplo mostrando o uso da função Pergunte

user function fncPergunte()
	Private cPerg1    := "QER051"

    RPCSetEnv("T1", "D MG 01","admin", "1234")

	Pergunte(cPerg1,.T.)
	conout("Pergunte executada")
return
