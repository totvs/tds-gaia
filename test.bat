set SK=cGstbGYtYjE2MzNlM2MtYzAzOC00ZGJlLWFmNTUtODJiZjIxYmUwZmQ1
set PK=c2stbGYtYmRhZDJhOGMtZjY0Ni00YWI2LTg4NmEtNjY0MDEwMzNjYzQ4

curl -X POST -H "Content-Type: application/json" ^
  --basic %SK%:%PK% ^
  --include ^
  https://logs.dta.totvs.ai ^
  -d '{ ^
  "batch": [ ^
    { ^
      "type": "trace-create", ^
      "id": "trace_id_20117-062d60af-21c9-4465", ^
      "timestamp": "2024-15-04T02:20:00.000Z", ^
      "body": { ^
        "id": "trace_id_00117-062d60af-21c9-4475", ^
        "name": "app-name", ^
        "userId": "dta@totvs.ai", ^
        "input": "some input events", ^
        "output": "some output events" ^
      } ^
    } ^
  ] ^
}'
