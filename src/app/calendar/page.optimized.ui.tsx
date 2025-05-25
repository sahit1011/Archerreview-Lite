  // Loading state
  if (loading && isInitialLoad) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-indigo-600 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading your calendar...</p>
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg className="h-5 w-5 text-red-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
          <div className="mt-4">
            <Link href="/dashboard" className="text-red-600 hover:text-red-800 font-medium">
              Back to Dashboard →
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Study Calendar</h1>
            {user && (
              <p className="text-gray-600">
                Viewing {user.name}'s personalized study schedule
              </p>
            )}
          </div>

          {user && user.examDate && (
            <div className="bg-indigo-50 rounded-lg p-3 text-center">
              <div className="text-sm font-medium text-indigo-600">Exam Date</div>
              <div className="text-xl font-bold text-gray-900">{format(new Date(user.examDate), 'MMM d, yyyy')}</div>
              <div className="text-sm mt-1 bg-indigo-100 text-indigo-800 rounded-full px-2 py-0.5 inline-block">
                {Math.ceil((new Date(user.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Calendar Filters */}
      <CalendarFilters
        onFilterChange={handleFilterChange}
        initialFilters={filters}
        topics={topics}
        topicsLoading={topicsLoading}
      />

      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
        {/* Loading indicator for task updates */}
        {loading && !isInitialLoad && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-t-3 border-indigo-600 border-solid rounded-full animate-spin"></div>
              <p className="mt-4 text-indigo-600 font-medium">Updating calendar...</p>
            </div>
          </div>
        )}

        {/* Calendar content */}
        <div className="relative">
          {loading && isInitialLoad ? (
            <CalendarSkeleton view={currentView === 'timeGridDay' ? 'day' : currentView === 'timeGridWeek' ? 'week' : 'month'} />
          ) : (
            <InteractiveCalendar
              tasks={filteredTasks}
              onTaskUpdate={handleTaskUpdate}
              onTaskClick={(taskId) => setSelectedTaskId(taskId)}
              onDateClick={(date) => setSelectedDate(date)}
              onAddTask={handleAddTask}
              selectedDate={selectedDate}
              initialView={initialView}
            />
          )}
        </div>

        <div className="bg-gray-50 py-3 px-4 text-sm text-gray-500 border-t">
          <div className="flex flex-col space-y-2">
            {tasks.length === 0 ? (
              <div className="py-2 text-center">
                <p>No tasks scheduled.</p>
                {user?.name === "New User" && (
                  <p className="mt-1">This user doesn't have any tasks scheduled yet.</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{filteredTasks.length}</span> tasks displayed
                  {filters.taskTypes.length > 0 || filters.taskStatuses.length > 0 || filters.topicIds.length > 0 || filters.hideCompleted ? (
                    <span> (filtered)</span>
                  ) : null}
                </div>
                <button
                  onClick={() => setResetConfirmOpen(true)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Reset to Original Plan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousDay}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={toggleDatePicker}
                  className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                >
                  <span className="font-medium">{format(selectedDate, 'MMMM d, yyyy')}</span>
                  <svg className="ml-1 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={goToNextDay}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={goToToday}
                  className="ml-2 px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
                >
                  Today
                </button>
              </div>
            </div>

            {loading && isInitialLoad ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : filteredTodaysTasks.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks for this day</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no tasks scheduled for this day.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => handleAddTask(selectedDate)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Task
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTodaysTasks.map((task) => (
                  <div 
                    key={task._id} 
                    className={`border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer ${
                      task.status === 'COMPLETED' ? 'bg-green-50 border-green-200' : ''
                    }`}
                    onClick={() => setSelectedTaskId(task._id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTaskBadgeBgColor(task.type)}`}>
                            {task.type}
                          </span>
                          {task.status === 'COMPLETED' && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                          )}
                          {task.status === 'IN_PROGRESS' && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              In Progress
                            </span>
                          )}
                        </div>
                        <h3 className="mt-1 text-lg font-semibold text-gray-900">{task.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {format(new Date(task.startTime), 'h:mm a')} - {format(new Date(task.endTime), 'h:mm a')}
                        </p>
                      </div>
                      <div className="flex">
                        {task.status !== 'COMPLETED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskStatusChange(task._id, 'COMPLETED');
                            }}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Mark as completed"
                          >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    {task.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Exam Countdown</h2>
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">
                {user?.examDate
                  ? Math.max(0, Math.ceil((new Date(user.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                  : '?'}
              </div>
              <div className="text-gray-600">Days Remaining</div>
              <div className="mt-4 text-sm text-gray-500">
                Exam Date: {user?.examDate ? format(new Date(user.examDate), 'MMMM d, yyyy') : 'Not set'}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Calendar Stats</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-600">Total Tasks</span>
                  <span className="text-sm font-bold text-gray-900">{tasks.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-600">Completed</span>
                  <span className="text-sm font-bold text-gray-900">
                    {tasks.filter(t => t.status === 'COMPLETED').length} / {tasks.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ 
                      width: `${tasks.length ? (tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-600">In Progress</span>
                  <span className="text-sm font-bold text-gray-900">
                    {tasks.filter(t => t.status === 'IN_PROGRESS').length} / {tasks.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ 
                      width: `${tasks.length ? (tasks.filter(t => t.status === 'IN_PROGRESS').length / tasks.length) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-600">Pending</span>
                  <span className="text-sm font-bold text-gray-900">
                    {tasks.filter(t => t.status === 'PENDING').length} / {tasks.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ 
                      width: `${tasks.length ? (tasks.filter(t => t.status === 'PENDING').length / tasks.length) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Popover */}
      <LazyTaskDetailPopover
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={isTaskCreationModalOpen}
        onClose={() => setIsTaskCreationModalOpen(false)}
        onSubmit={handleCreateTask}
        initialDate={taskCreationDate || new Date()}
        studyPlanId={studyPlan?._id || ''}
      />

      {/* Reset Confirmation Dialog */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reset Schedule</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reset your schedule to the original plan? This will undo all your manual changes.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResetSchedule}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Reset Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
