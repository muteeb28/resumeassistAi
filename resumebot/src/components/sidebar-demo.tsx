"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function SidebarDemo() {
  const links = [
    {
      label: "Resume",
      href: "/login",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Cover Letter",
      href: "/login",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Job Tracker",
      href: "/login",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "More",
      href: "/login",
      icon: (
        <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800",
        "h-[60vh]", // for your use case, use `h-screen` instead of `h-[60vh]`
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "User",
                href: "/login",
                icon: (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-neutral-300 text-[11px] font-semibold text-neutral-700 flex items-center justify-center">
                    U
                  </div>
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <Dashboard />
    </div>
  );
}
export const Logo = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        ResumeAssist AI
      </motion.span>
    </a>
  );
};
export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </a>
  );
};

type StatusOption = "Applied" | "Interview" | "Offer" | "Rejected";

type JobRow = {
  id: string;
  company: string;
  title: string;
  status: StatusOption;
  link: string;
  contact: string;
  date: string;
  stage: string;
  custom: Record<string, string>;
};

type CustomColumn = {
  id: string;
  label: string;
};

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const statusClasses: Record<StatusOption, string> = {
  Applied: "bg-amber-200 text-amber-900",
  Interview: "bg-blue-200 text-blue-900",
  Offer: "bg-emerald-200 text-emerald-900",
  Rejected: "bg-red-200 text-red-900",
};

const Dashboard = () => {
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [rows, setRows] = useState<JobRow[]>([
    {
      id: createId("row"),
      company: "Alpha Company",
      title: "Data Analyst",
      status: "Offer",
      link: "example.com/jobposting",
      contact: "Jane",
      date: "3/21/2025",
      stage: "Third Round",
      custom: {},
    },
    {
      id: createId("row"),
      company: "Beta Company",
      title: "Healthcare Data Analyst",
      status: "Rejected",
      link: "example.com/jobposting",
      contact: "Jack",
      date: "3/21/2025",
      stage: "First Round",
      custom: {},
    },
    {
      id: createId("row"),
      company: "Gamma Company",
      title: "Data Science Analyst",
      status: "Interview",
      link: "example.com/jobposting",
      contact: "Anna",
      date: "4/1/2025",
      stage: "First Round",
      custom: {},
    },
    {
      id: createId("row"),
      company: "Delta Company",
      title: "Data Analyst",
      status: "Applied",
      link: "example.com/jobposting",
      contact: "Maya",
      date: "4/1/2025",
      stage: "Recruiter Screen",
      custom: {},
    },
  ]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: createId("row"),
        company: "",
        title: "",
        status: "Applied",
        link: "",
        contact: "",
        date: "",
        stage: "",
        custom: {},
      },
    ]);
  };

  const deleteRow = (rowId: string) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const updateRowField = (
    rowId: string,
    field: keyof JobRow,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const updateCustomField = (rowId: string, columnId: string, value: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? { ...row, custom: { ...row.custom, [columnId]: value } }
          : row
      )
    );
  };

  const addColumn = () => {
    setCustomColumns((prev) => [
      ...prev,
      { id: createId("column"), label: "New Column" },
    ]);
  };

  const deleteColumn = (columnId: string) => {
    setCustomColumns((prev) => prev.filter((column) => column.id !== columnId));
    setRows((prev) =>
      prev.map((row) => {
        const nextCustom = { ...row.custom };
        delete nextCustom[columnId];
        return { ...row, custom: nextCustom };
      })
    );
  };

  const updateColumnLabel = (columnId: string, value: string) => {
    setCustomColumns((prev) =>
      prev.map((column) =>
        column.id === columnId ? { ...column, label: value } : column
      )
    );
  };

  return (
    <div className="flex flex-1">
      <div className="flex h-full w-full flex-1 flex-col gap-6 rounded-tl-2xl border border-neutral-200 bg-white p-4 md:p-8 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Job Applications Tracker
            </h3>
            <p className="text-sm text-neutral-500">
              Track and manage all your job applications in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addRow}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400 dark:border-neutral-600 dark:text-neutral-200"
            >
              Add card
            </button>
            <button
              type="button"
              onClick={addColumn}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400 dark:border-neutral-600 dark:text-neutral-200"
            >
              Add Column
            </button>
          </div>
        </div>

        <div className="overflow-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-3 py-2 font-semibold">Company</th>
                <th className="px-3 py-2 font-semibold">Title</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Job Posting Link</th>
                <th className="px-3 py-2 font-semibold">Contact</th>
                <th className="px-3 py-2 font-semibold">Application Date</th>
                <th className="px-3 py-2 font-semibold">Interview Stage</th>
                {customColumns.map((column) => (
                  <th key={column.id} className="px-3 py-2 font-semibold">
                    <div className="flex items-center gap-2">
                      <input
                        value={column.label}
                        onChange={(event) =>
                          updateColumnLabel(column.id, event.target.value)
                        }
                        className="w-full bg-transparent text-xs font-semibold text-white placeholder:text-white/70 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => deleteColumn(column.id)}
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white/80 hover:text-white"
                        aria-label={`Delete ${column.label} column`}
                      >
                        X
                      </button>
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-neutral-200 last:border-b-0 dark:border-neutral-700">
                  <td className="px-3 py-2">
                    <input
                      value={row.company}
                      onChange={(event) =>
                        updateRowField(row.id, "company", event.target.value)
                      }
                      className="w-full bg-transparent text-xs text-neutral-800 focus:outline-none dark:text-neutral-100"
                      placeholder="Company"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.title}
                      onChange={(event) =>
                        updateRowField(row.id, "title", event.target.value)
                      }
                      className="w-full bg-transparent text-xs text-neutral-800 focus:outline-none dark:text-neutral-100"
                      placeholder="Role title"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={row.status}
                      onChange={(event) =>
                        updateRowField(row.id, "status", event.target.value)
                      }
                      className={cn(
                        "rounded-full px-2 py-1 text-[11px] font-semibold",
                        statusClasses[row.status]
                      )}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interview">Interview</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.link}
                      onChange={(event) =>
                        updateRowField(row.id, "link", event.target.value)
                      }
                      className="w-full bg-transparent text-xs text-neutral-800 focus:outline-none dark:text-neutral-100"
                      placeholder="example.com/jobposting"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.contact}
                      onChange={(event) =>
                        updateRowField(row.id, "contact", event.target.value)
                      }
                      className="w-full bg-transparent text-xs text-neutral-800 focus:outline-none dark:text-neutral-100"
                      placeholder="Contact"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.date}
                      onChange={(event) =>
                        updateRowField(row.id, "date", event.target.value)
                      }
                      className="w-full bg-transparent text-xs text-neutral-800 focus:outline-none dark:text-neutral-100"
                      placeholder="MM/DD/YYYY"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.stage}
                      onChange={(event) =>
                        updateRowField(row.id, "stage", event.target.value)
                      }
                      className="w-full bg-transparent text-xs text-neutral-800 focus:outline-none dark:text-neutral-100"
                      placeholder="Stage"
                    />
                  </td>
                  {customColumns.map((column) => (
                    <td key={column.id} className="px-3 py-2">
                      <input
                        value={row.custom[column.id] || ""}
                        onChange={(event) =>
                          updateCustomField(row.id, column.id, event.target.value)
                        }
                        className="w-full bg-transparent text-xs text-neutral-800 focus:outline-none dark:text-neutral-100"
                        placeholder="Value"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => deleteRow(row.id)}
                      className="text-[11px] font-semibold text-neutral-500 transition hover:text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
