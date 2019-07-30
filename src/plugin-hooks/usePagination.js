import React from 'react'
import PropTypes from 'prop-types'

//
import { addActions, actions } from '../actions'
import { defaultState } from '../hooks/useTableState'

defaultState.pageSize = 10
defaultState.pageIndex = 0

addActions('pageChange', 'pageSizeChange')

const propTypes = {
  // General
  manualPagination: PropTypes.bool,
}

// SSR has issues with useLayoutEffect still, so use useEffect during SSR
let useLayoutEffect =
  typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
    ? React.useLayoutEffect
    : React.useEffect

export const usePagination = hooks => {
  hooks.useMain.push(useMain)
}

function useMain(instance) {
  PropTypes.checkPropTypes(propTypes, instance, 'property', 'usePagination')

  const {
    rows,
    manualPagination,
    disablePageResetOnDataChange,
    debug,
    state: [
      {
        pageSize,
        pageIndex,
        pageCount: userPageCount,
        filters,
        groupBy,
        sortBy,
      },
      setState,
    ],
  } = instance

  const rowDep = disablePageResetOnDataChange ? null : rows

  useLayoutEffect(
    () => {
      setState(
        old => ({
          ...old,
          pageIndex: 0,
        }),
        actions.pageChange
      )
    },
    [setState, rowDep, filters, groupBy, sortBy]
  )

  const { pages, pageCount } = React.useMemo(
    () => {
      if (manualPagination) {
        return {
          pages: [rows],
          pageCount: userPageCount,
        }
      }
      if (debug) console.info('getPages')

      // Create a new pages with the first page ready to go.
      const pages = rows.length ? [] : [[]]

      // Start the pageIndex and currentPage cursors
      let cursor = 0
      while (cursor < rows.length) {
        const end = cursor + pageSize
        pages.push(rows.slice(cursor, end))
        cursor = end
      }

      const pageCount = pages.length

      return {
        pages,
        pageCount,
      }
    },
    [manualPagination, debug, rows, userPageCount, pageSize]
  )

  const pageOptions = React.useMemo(
    () => [...new Array(pageCount)].map((d, i) => i),
    [pageCount]
  )

  const page = manualPagination ? rows : pages[pageIndex] || []
  const canPreviousPage = pageIndex > 0
  const canNextPage = pageIndex < pageCount - 1

  const gotoPage = pageIndex => {
    if (debug) console.info('gotoPage')
    return setState(old => {
      if (pageIndex < 0 || pageIndex > pageCount - 1) {
        return old
      }
      return {
        ...old,
        pageIndex,
      }
    }, actions.pageChange)
  }

  const previousPage = () => {
    return gotoPage(pageIndex - 1)
  }

  const nextPage = () => {
    return gotoPage(pageIndex + 1)
  }

  const setPageSize = pageSize => {
    setState(old => {
      const topRowIndex = old.pageSize * old.pageIndex
      const pageIndex = Math.floor(topRowIndex / pageSize)
      return {
        ...old,
        pageIndex,
        pageSize,
      }
    }, actions.pageSizeChange)
  }

  return {
    ...instance,
    pages,
    pageOptions,
    pageCount,
    page,
    canPreviousPage,
    canNextPage,
    gotoPage,
    previousPage,
    nextPage,
    setPageSize,
    pageIndex,
    pageSize,
  }
}