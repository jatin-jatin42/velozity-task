import { Link } from "react-router-dom";
import type { Task, TaskStatus } from "../types";

type TaskTableProps = {
  tasks: Task[];
  showProject?: boolean;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  emptyMessage?: string;
};

const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

export const TaskTable = ({
  tasks,
  showProject = false,
  onStatusChange,
  emptyMessage = "No tasks found."
}: TaskTableProps) => (
  <section className="panel">
    <div className="panel__header">
      <h2>Tasks</h2>
    </div>
    <div className="table-wrap">
      <table className="task-table">
        <thead>
          <tr>
            <th>Task</th>
            {showProject ? <th>Project</th> : null}
            <th>Assignee</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Due</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={showProject ? 6 : 5} className="empty-state">
                {emptyMessage}
              </td>
            </tr>
          ) : null}
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>
                <Link to={`/tasks/${task.id}`}>{task.title}</Link>
                {task.isOverdue ? <span className="tag tag--warning">Overdue</span> : null}
              </td>
              {showProject ? <td>{task.project.name}</td> : null}
              <td>{task.assignedDeveloper?.name ?? "Unassigned"}</td>
              <td>
                <span className={`tag tag--${task.priority.toLowerCase()}`}>{task.priority}</span>
              </td>
              <td>
                {onStatusChange ? (
                  <select
                    value={task.status}
                    onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ) : (
                  task.status
                )}
              </td>
              <td>{new Date(task.dueDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);
