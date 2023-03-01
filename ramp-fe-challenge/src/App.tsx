import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { isTemplateExpression } from "typescript"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [transactions, setTransactions] = useState<any>([])

  // const currentTransactions = useMemo(() => {
  //   if (paginatedTransactions?.data) {
  //     if (transactions) {
  //       return [...transactions, ...paginatedTransactions?.data]
  //     }
  //     return paginatedTransactions?.data
  //   } else {
  //     setTransactions(null)
  //     return transactionsByEmployee || null
  //   }
  // }, [paginatedTransactions, transactionsByEmployee])
  const currentTransactions = useMemo(() => {
    if (paginatedTransactions) {
      return transactionsByEmployee ? [...transactionsByEmployee, ...paginatedTransactions.data] : paginatedTransactions.data;
    } else {
      return transactionsByEmployee || [];
    }
  }, [paginatedTransactions, transactionsByEmployee]);

  useEffect(() => {
    setTransactions((previousTransaction:any)=>[...previousTransaction, ...currentTransactions])
  },[paginatedTransactions])

  useEffect(()=>{
    setTransactions(null)
    setTransactions(currentTransactions)
  },[transactionsByEmployee])

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()

    await employeeUtils.fetchAll()
    setIsLoading(false)
    await paginatedTransactionsUtils.fetchAll()
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />
        <hr className="RampBreak--l" />
        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null || !newValue.id) {
              await loadAllTransactions()
              return
            } else {
              await loadTransactionsByEmployee(newValue.id)
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />
          {transactions !== null &&
          paginatedTransactions &&
          paginatedTransactions?.data?.length &&
          paginatedTransactions?.nextPage !== null ? (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          ) : null}
        </div>
      </main>
    </Fragment>
  )
}
