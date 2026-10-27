'use client';

import { useId } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tacc/core-components/ui/table';
import { Spinner } from '@tacc/core-components/ui/spinner';

const users = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i % 10 === 0 ? 'Admin' : 'Member',
}));

// Both tables must use identical column widths.
function Columns() {
  return (
    <colgroup>
      <col style={{ width: '5rem' }} />
      <col style={{ width: '25%' }} />
      <col />
      <col style={{ width: '7rem' }} />
    </colgroup>
  );
}

function HeaderRow() {
  return (
    <TableRow>
      <TableHead scope="col">ID</TableHead>
      <TableHead scope="col">Name</TableHead>
      <TableHead scope="col">Email</TableHead>
      <TableHead scope="col" className="tw:text-right">
        Role
      </TableHead>
    </TableRow>
  );
}

export function UIPatternsFlexTable() {
  const captionId = useId();

  return (
    <>
      <div className="tw:flex tw:min-h-0 tw:min-w-0 tw:flex-1 tw:flex-col tw:overflow-x-auto">
        <Table
          aria-hidden="true"
          className="tw:table-fixed"
          containerClassName="
          tw:min-w-[800px] tw:shrink-0
          tw:overflow-hidden!
          tw:[scrollbar-gutter:stable]
        "
        >
          <Columns />
          <TableHeader className="tw:bg-background tw:[&_th]:shadow-[inset_0_-1px_0_0_#000]">
            <HeaderRow />
          </TableHeader>
        </Table>

        <Table
          aria-describedby={captionId}
          className="tw:table-fixed"
          containerClassName="
          tw:min-h-0 tw:min-w-[800px] tw:flex-1
          tw:overflow-x-hidden! tw:overflow-y-auto!
          tw:[scrollbar-gutter:stable]
          tw:scroll-fade-b tw:scroll-fade-30
        "
        >
          <Columns />

          <TableHeader className="tw:sr-only">
            <HeaderRow />
          </TableHeader>

          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="tw:font-medium">{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="tw:text-right">{user.role}</TableCell>
              </TableRow>
            ))}

            <TableRow>
              <TableCell colSpan={4} className="tw:h-12">
                <div className="tw:flex tw:items-center tw:justify-center">
                  <Spinner
                    className="tw:size-4 tw:animate-spin tw:text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="tw:sr-only">Loading more users…</span>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <p
        id={captionId}
        className="tw:shrink-0 tw:border-t tw:bg-background tw:p-3 tw:text-center tw:text-sm tw:text-muted-foreground"
      >
        A list of {users.length} users.
      </p>
    </>
  );
}
