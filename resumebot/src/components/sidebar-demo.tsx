import { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconLayoutDashboard,
  IconSettings,
  IconUsers,
  IconChartLine,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import HrEmailsTable from "./hr-emails-table";

export default function SidebarDemo() {
  const links = [
    {
      label: "Dashboard",
      href: "/login",
      icon: (
        <IconLayoutDashboard className="h-5 w-5 shrink-0 text-neutral-600" />
      ),
    },
    {
      label: "Users",
      href: "/login",
      icon: (
        <IconUsers className="h-5 w-5 shrink-0 text-neutral-600" />
      ),
    },
    {
      label: "Reports",
      href: "/login",
      icon: (
        <IconChartLine className="h-5 w-5 shrink-0 text-neutral-600" />
      ),
    },
    {
      label: "Settings",
      href: "/login",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-neutral-600" />
      ),
    },
  ];
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 md:flex-row",
        "h-[60vh]", // for your use case, use `h-screen` instead of `h-[60vh]`
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 border-r border-neutral-200 bg-white">
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
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-neutral-900"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-neutral-900" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-neutral-900"
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
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-neutral-900"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-neutral-900" />
    </a>
  );
};

const Dashboard = () => {
  const [view, setView] = useState<"tracker" | "emails">("tracker");

  type ApplicationStatus = "Offer" | "Rejected" | "Interview" | "Applied";
  type EditableField = "company" | "title" | "link" | "contact" | "date" | "stage";
  type CustomColumn = { id: string; label: string };
  type JobRow = {
    id: string;
    company: string;
    title: string;
    status: ApplicationStatus;
    link: string;
    contact: string;
    date: string;
    stage: string;
    custom: Record<string, string>;
  };

  const createId = (prefix: string) =>
    `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const statusClasses: Record<ApplicationStatus, string> = {
    Offer: "bg-neutral-900 text-white",
    Interview: "bg-neutral-200 text-neutral-700",
    Applied: "bg-neutral-100 text-neutral-700",
    Rejected: "bg-neutral-300 text-neutral-700",
  };

  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [rows, setRows] = useState<JobRow[]>(() => [
    {
      id: createId("row"),
      company: "Alpha Company",
      title: "Data Analyst",
      status: "Offer",
      link: "example.com/jobpos",
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
      link: "example.com/jobpos",
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
      link: "example.com/jobpos",
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
      link: "example.com/jobpos",
      contact: "Maya",
      date: "4/1/2025",
      stage: "Recruiter Screen",
      custom: {},
    },
  ]);

  const addRow = () => {
    const custom = customColumns.reduce<Record<string, string>>((acc, column) => {
      acc[column.id] = "";
      return acc;
    }, {});

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
        custom,
      },
    ]);
  };

  const deleteRow = (rowId: string) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const updateRowField = (rowId: string, field: EditableField, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  const updateRowStatus = (rowId: string, status: ApplicationStatus) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, status } : row))
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
    const id = createId("column");
    setCustomColumns((prev) => [...prev, { id, label: "New Column" }]);
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        custom: { ...row.custom, [id]: "" },
      }))
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
      <div className="flex h-full w-full flex-1 flex-col gap-6 bg-neutral-50 p-4 md:p-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
                Workspace
              </p>
              <p className="text-lg font-semibold text-neutral-900">
                Job Tracker Preview
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 p-1">
              <button
                type="button"
                onClick={() => setView("tracker")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[11px] font-semibold transition",
                  view === "tracker"
                    ? "bg-neutral-900 text-white shadow"
                    : "text-neutral-500 hover:text-neutral-900"
                )}
              >
                Job Tracker UI
              </button>
              <button
                type="button"
                onClick={() => setView("emails")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[11px] font-semibold transition",
                  view === "emails"
                    ? "bg-neutral-900 text-white shadow"
                    : "text-neutral-500 hover:text-neutral-900"
                )}
              >
                HR Emails
              </button>
            </div>
          </div>

          {view === "tracker" ? (
            <>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    Job Applications Tracker
                  </p>
                  <p className="text-xs text-neutral-500">
                    Track and manage all your job applications in one place.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex h-8 items-center rounded-md border border-neutral-200 bg-white px-2.5 text-[11px] font-semibold text-neutral-700 transition hover:border-neutral-300"
                  >
                    Add card
                  </button>
                  <button
                    type="button"
                    onClick={addColumn}
                    className="inline-flex h-8 items-center rounded-md border border-neutral-200 bg-white px-2.5 text-[11px] font-semibold text-neutral-700 transition hover:border-neutral-300"
                  >
                    Add Column
                  </button>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200">
                <table className="min-w-[720px] w-full text-left text-xs">
                  <thead className="bg-neutral-900 text-white">
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
                          <input
                            value={column.label}
                            onChange={(event) =>
                              updateColumnLabel(column.id, event.target.value)
                            }
                            className="w-full bg-transparent text-[11px] font-semibold text-white placeholder:text-white/70 focus:outline-none"
                          />
                        </th>
                      ))}
                      <th className="px-3 py-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-neutral-200 last:border-b-0"
                      >
                        <td className="px-3 py-2 text-neutral-900">
                          <input
                            value={row.company}
                            onChange={(event) =>
                              updateRowField(row.id, "company", event.target.value)
                            }
                            className="w-full bg-transparent text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                            placeholder="Company"
                          />
                        </td>
                        <td className="px-3 py-2 text-neutral-900">
                          <input
                            value={row.title}
                            onChange={(event) =>
                              updateRowField(row.id, "title", event.target.value)
                            }
                            className="w-full bg-transparent text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                            placeholder="Title"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={row.status}
                            onChange={(event) =>
                              updateRowStatus(row.id, event.target.value as ApplicationStatus)
                            }
                            className={cn(
                              "rounded-full px-2 py-1 text-[11px] font-semibold focus:outline-none",
                              statusClasses[row.status]
                            )}
                          >
                            <option value="Offer">Offer</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Interview">Interview</option>
                            <option value="Applied">Applied</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 text-neutral-600">
                          <input
                            value={row.link}
                            onChange={(event) =>
                              updateRowField(row.id, "link", event.target.value)
                            }
                            className="w-full bg-transparent text-xs text-neutral-600 placeholder:text-neutral-400 focus:outline-none"
                            placeholder="example.com/jobpos"
                          />
                        </td>
                        <td className="px-3 py-2 text-neutral-700">
                          <input
                            value={row.contact}
                            onChange={(event) =>
                              updateRowField(row.id, "contact", event.target.value)
                            }
                            className="w-full bg-transparent text-xs text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
                            placeholder="Contact"
                          />
                        </td>
                        <td className="px-3 py-2 text-neutral-700">
                          <input
                            value={row.date}
                            onChange={(event) =>
                              updateRowField(row.id, "date", event.target.value)
                            }
                            className="w-full bg-transparent text-xs text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
                            placeholder="MM/DD/YYYY"
                          />
                        </td>
                        <td className="px-3 py-2 text-neutral-700">
                          <input
                            value={row.stage}
                            onChange={(event) =>
                              updateRowField(row.id, "stage", event.target.value)
                            }
                            className="w-full bg-transparent text-xs text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
                            placeholder="Stage"
                          />
                        </td>
                        {customColumns.map((column) => (
                          <td key={column.id} className="px-3 py-2 text-neutral-700">
                            <input
                              value={row.custom[column.id] || ""}
                              onChange={(event) =>
                                updateCustomField(row.id, column.id, event.target.value)
                              }
                              className="w-full bg-transparent text-xs text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
                              placeholder="Value"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => deleteRow(row.id)}
                            className="text-[11px] font-semibold text-neutral-500 transition hover:text-neutral-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="mt-4">
              <HrEmailsTable
                className="border-neutral-200 shadow-none"
                tableClassName="max-h-[320px]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
