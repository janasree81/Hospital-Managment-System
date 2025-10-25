import React, { useState, useMemo, useEffect } from 'react';
import { Appointment, Role, User, DoctorAvailability } from '../types';
import { getAppointments, createAppointment, updateAppointment } from '../services/appointmentService';
import { DEPARTMENTS, MOCK_DOCTOR_AVAILABILITY, AVAILABLE_TIME_SLOTS } from '../constants';

interface AppointmentSchedulerProps {
    user: User;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({ user }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availabilities] = useState<DoctorAvailability[]>(MOCK_DOCTOR_AVAILABILITY);
  const [showForm, setShowForm] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for new appointments
  const [newAppointment, setNewAppointment] = useState({
      patientName: user.role === Role.Patient ? user.name : '',
      department: '',
      doctorName: '',
      date: '',
      time: '',
      reason: '',
      appointmentType: 'In-person' as 'In-person' | 'Video Consultation',
      isFollowUp: false,
  });

  // State for rescheduling modal
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        const fetchedAppointments = await getAppointments();
        setAppointments(fetchedAppointments);
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
        alert("Could not load appointments. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      
      if (type === 'checkbox') {
        setNewAppointment(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
      } else {
        setNewAppointment(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'department') {
                updated.doctorName = '';
                updated.time = '';
            }
            if (name === 'doctorName' || name === 'date') {
                updated.time = '';
            }
            return updated;
        });
      }
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const createdAppointment = await createAppointment(newAppointment);
        setAppointments(prev => [...prev, createdAppointment].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setShowForm(false);
        setNewAppointment({
            patientName: user.role === Role.Patient ? user.name : '',
            department: '',
            doctorName: '',
            date: '',
            time: '',
            reason: '',
            appointmentType: 'In-person',
            isFollowUp: false,
        });
      } catch (error) {
        console.error("Failed to create appointment:", error);
        alert("Failed to save the appointment. Please check the details and try again.");
      }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
        const updatedAppt = await updateAppointment(id, { status: 'Cancelled' });
        setAppointments(prev => prev.map(app => app.id === id ? updatedAppt : app));
    } catch (error) {
        alert("Failed to cancel appointment. Please try again.");
    }
  };

  const handleOpenReschedule = (appointment: Appointment) => {
    setReschedulingAppointment(appointment);
    setIsRescheduleModalOpen(true);
  };
  
  const handleUpdateAppointment = (updatedAppointment: Appointment) => {
    setAppointments(prev => prev.map(app => app.id === updatedAppointment.id ? updatedAppointment : app));
  }

  const availableDoctors = useMemo(() => {
    return DEPARTMENTS.find(d => d.name === newAppointment.department)?.doctors || [];
  }, [newAppointment.department]);

  const availableTimeSlots = useMemo(() => {
    if (!newAppointment.doctorName || !newAppointment.date) return [];
    
    const dateParts = newAppointment.date.split('-');
    const selectedDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDate.getDay()];
    
    const doctorAvailability = availabilities.find(a => a.doctorName === newAppointment.doctorName);
    if (!doctorAvailability || !doctorAvailability.availableDays.includes(dayOfWeek as any)) return [];

    const bookedSlots = appointments
        .filter(app => app.doctorName === newAppointment.doctorName && app.date === newAppointment.date && (app.status === 'Scheduled' || app.status === 'Rescheduled'))
        .map(app => app.time);

    return doctorAvailability.availableSlots.filter(slot => !bookedSlots.includes(slot));
  }, [newAppointment.doctorName, newAppointment.date, appointments, availabilities]);

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Rescheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAppointments = useMemo(() => {
    let apps = appointments;
    if (user.role === Role.Patient) apps = apps.filter(app => app.patientName === user.name);
    else if (user.role === Role.Doctor) apps = apps.filter(app => app.doctorName === user.name);

    if (searchTerm) {
        const lowercasedTerm = searchTerm.toLowerCase();
        apps = apps.filter(app =>
            app.patientName.toLowerCase().includes(lowercasedTerm) ||
            app.doctorName.toLowerCase().includes(lowercasedTerm) ||
            app.department.toLowerCase().includes(lowercasedTerm)
        );
    }
    return apps.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, user.role, user.name, searchTerm]);
  
  const toggleRow = (id: string) => {
      setExpandedRow(prevId => (prevId === id ? null : id));
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Appointments</h2>
        <div className="flex items-center space-x-4">
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-2 border rounded-md"/>
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                {showForm ? 'Cancel' : '+ New Appointment'}
            </button>
        </div>
      </div>

      {showForm && (
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 border rounded-lg bg-gray-50">
              <div className="md:col-span-2">
                  <label htmlFor="patientName" className="block text-sm font-medium text-gray-700">Patient Name</label>
                  <input type="text" name="patientName" value={newAppointment.patientName} onChange={handleInputChange} required readOnly={user.role === Role.Patient} className="mt-1 block w-full px-3 py-2 border rounded-md read-only:bg-gray-100"/>
              </div>
              <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                  <select name="department" value={newAppointment.department} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border bg-white rounded-md">
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(dep => <option key={dep.name} value={dep.name}>{dep.name}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700">Doctor</label>
                  <select name="doctorName" value={newAppointment.doctorName} onChange={handleInputChange} required disabled={!newAppointment.department} className="mt-1 block w-full px-3 py-2 border bg-white rounded-md disabled:bg-gray-200">
                      <option value="">Select Doctor</option>
                      {availableDoctors.map(doc => <option key={doc} value={doc}>{doc}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">Preferred Date</label>
                  <input type="date" name="date" value={newAppointment.date} onChange={handleInputChange} required disabled={!newAppointment.doctorName} className="mt-1 block w-full px-3 py-2 border rounded-md disabled:bg-gray-200"/>
              </div>
              <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700">Preferred Time</label>
                   <select name="time" value={newAppointment.time} onChange={handleInputChange} required disabled={!newAppointment.date || availableTimeSlots.length === 0} className="mt-1 block w-full px-3 py-2 border bg-white rounded-md disabled:bg-gray-200">
                        <option value="">{availableTimeSlots.length > 0 ? 'Select a time' : 'No slots available'}</option>
                        {availableTimeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                    </select>
              </div>
              <div className="md:col-span-2">
                   <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Visit</label>
                   <textarea name="reason" rows={3} value={newAppointment.reason} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border rounded-md"></textarea>
              </div>
               <div>
                  <label htmlFor="appointmentType" className="block text-sm font-medium text-gray-700">Appointment Type</label>
                  <select name="appointmentType" value={newAppointment.appointmentType} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border bg-white rounded-md">
                      <option value="In-person">In-person</option>
                      <option value="Video Consultation">Video Consultation</option>
                  </select>
              </div>
              <div className="flex items-center justify-start">
                   <div className="flex items-center h-full mt-6">
                    <input id="isFollowUp" name="isFollowUp" type="checkbox" checked={newAppointment.isFollowUp} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded"/>
                    <label htmlFor="isFollowUp" className="ml-2 block text-sm text-gray-900">Is this a follow-up visit?</label>
                </div>
              </div>

              <div className="col-span-full text-right">
                  <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                      Confirm Appointment
                  </button>
              </div>
          </form>
      )}
      
      {isLoading ? ( <p>Loading appointments...</p> ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Details</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAppointments.map((appointment: Appointment) => (
              <React.Fragment key={appointment.id}>
              <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRow(appointment.id)}>
                <td className="px-6 py-4 whitespace-nowrap">{appointment.patientName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{appointment.doctorName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{appointment.date} - {appointment.time}</td>
                <td className="px-6 py-4 whitespace-nowrap">{appointment.appointmentType} {appointment.isFollowUp ? '(Follow-up)' : ''}</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>{appointment.status}</span></td>
                <td className="px-6 py-4 text-right"><svg className={`w-5 h-5 transition-transform ${expandedRow === appointment.id ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg></td>
              </tr>
              {expandedRow === appointment.id && (
                  <tr>
                      <td colSpan={6} className="p-4 bg-gray-50">
                          <div className="flex justify-between items-start">
                               <div>
                                  <p><strong>Reason:</strong> {appointment.reason}</p>
                               </div>
                               {user.role === Role.Patient && (appointment.status === 'Scheduled' || appointment.status === 'Rescheduled') && (
                                  <div className="flex space-x-2">
                                      <button onClick={() => handleOpenReschedule(appointment)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">Reschedule</button>
                                      <button onClick={() => handleCancelAppointment(appointment.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">Cancel</button>
                                  </div>
                               )}
                          </div>
                      </td>
                  </tr>
              )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      )}
      {isRescheduleModalOpen && reschedulingAppointment && (
        <RescheduleModal
          appointment={reschedulingAppointment}
          availabilities={availabilities}
          allAppointments={appointments}
          onClose={() => setIsRescheduleModalOpen(false)}
          onReschedule={handleUpdateAppointment}
        />
      )}
    </div>
  );
};

// Reschedule Modal Component
const RescheduleModal: React.FC<{
  appointment: Appointment;
  availabilities: DoctorAvailability[];
  allAppointments: Appointment[];
  onClose: () => void;
  onReschedule: (updatedAppointment: Appointment) => void;
}> = ({ appointment, availabilities, allAppointments, onClose, onReschedule }) => {
  const [newDate, setNewDate] = useState(appointment.date);
  const [newTime, setNewTime] = useState('');

  const availableTimeSlots = useMemo(() => {
    if (!newDate) return [];
    
    const dateParts = newDate.split('-');
    const selectedDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedDate.getDay()];
    
    const doctorAvailability = availabilities.find(a => a.doctorName === appointment.doctorName);
    if (!doctorAvailability || !doctorAvailability.availableDays.includes(dayOfWeek as any)) return [];

    const bookedSlots = allAppointments
        .filter(app => app.doctorName === appointment.doctorName && app.date === newDate && app.id !== appointment.id && (app.status === 'Scheduled' || app.status === 'Rescheduled'))
        .map(app => app.time);

    return doctorAvailability.availableSlots.filter(slot => !bookedSlots.includes(slot));
  }, [newDate, appointment, availabilities, allAppointments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTime) {
      alert("Please select a new date and time.");
      return;
    }
    try {
      const updatedAppt = await updateAppointment(appointment.id, {
        status: 'Rescheduled',
        date: newDate,
        time: newTime,
      });
      onReschedule(updatedAppt);
      onClose();
    } catch (error) {
      alert("Failed to reschedule. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Reschedule Appointment</h3>
        <p className="mb-4">For: {appointment.patientName} with {appointment.doctorName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newDate" className="block text-sm font-medium text-gray-700">New Date</label>
            <input type="date" id="newDate" value={newDate} onChange={e => { setNewDate(e.target.value); setNewTime(''); }} required className="mt-1 block w-full px-3 py-2 border rounded-md"/>
          </div>
           <div>
            <label htmlFor="newTime" className="block text-sm font-medium text-gray-700">New Time</label>
            <select id="newTime" value={newTime} onChange={e => setNewTime(e.target.value)} required disabled={!newDate || availableTimeSlots.length === 0} className="mt-1 block w-full px-3 py-2 border bg-white rounded-md disabled:bg-gray-200">
                <option value="">{availableTimeSlots.length > 0 ? 'Select a time' : 'No slots available'}</option>
                {availableTimeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Confirm Reschedule</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
