// Utility to run promises with concurrency control
export const promiseAllConcurrent = (concurrency: number) => {
  return async <T>(promises: (() => Promise<T>)[]): Promise<T[]> => {
    const results: T[] = []
    const executing: Promise<void>[] = []

    for (let i = 0; i < promises.length; i++) {
      const promise = promises[i]().then(result => {
        results[i] = result
      })

      executing.push(promise)

      if (executing.length >= concurrency) {
        await Promise.race(executing)
        executing.splice(executing.findIndex(p => p === promise), 1)
      }
    }

    await Promise.all(executing)
    return results
  }
}

// Add it to Promise prototype like in original code
declare global {
  interface PromiseConstructor {
    allConcurrent: (concurrency: number) => <T>(promises: (() => Promise<T>)[]) => Promise<T[]>
  }
}

if (typeof Promise.allConcurrent === 'undefined') {
  Promise.allConcurrent = promiseAllConcurrent
} 