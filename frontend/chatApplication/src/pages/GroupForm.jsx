import React, { useState ,useEffect} from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Users, Image as ImageIcon, Info, Loader2, Plus, X, Phone } from 'lucide-react';
import { messageStore } from '../store/message.store';
import { groupStore } from '../store/group.store';

const CreateGroup = () => {
      const { get_all_contacts,contacts}=messageStore()
    const {createGroup,isCreatingGroup,get_all_group,groups}=groupStore()
    const [groupData, setGroupData] = useState({
        name: '',
        description: '',
        imageFile: null,  // Actual file object
        imagePreview: null,  // URL for preview
        members: []
      });
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', phoneNumber: '' });

  // Dummy contacts data
 
    useEffect(() => {
        get_all_group();
      get_all_contacts();
    }, [get_all_contacts]);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
          setGroupData({ 
            ...groupData, 
            imageFile: e.target.files[0],
            imagePreview: URL.createObjectURL(e.target.files[0]) 
          });
        }
      };

  const handleAddContact = (contact) => {
    console.log(contact)
    if (!selectedContacts.some(c => c._id === contact._id)) {
      setSelectedContacts([...selectedContacts, contact]);
      setGroupData({ ...groupData, members: [...groupData.members, contact.userId._id] });
    }
  };
console.log(groups)
  const handleAddNewContact = () => {
    if (newContact.name && newContact.phoneNumber) {
      const newId = Date.now(); // Generate a temporary ID
      const contact = {
        id: newId,
        name: newContact.name,
        phoneNumber: newContact.phoneNumber
      };
      
      setSelectedContacts([...selectedContacts, contact]);
      setGroupData({ ...groupData, members: [...groupData.members, newId] });
      setNewContact({ name: '', phoneNumber: '' }); // Reset the input fields
    }
  };

  const handleRemoveContact = (contactId) => {
    setSelectedContacts(selectedContacts.filter(contact => contact.id !== contactId));
    setGroupData({ ...groupData, members: groupData.members.filter(id => id !== contactId) });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let new_group_obj=new FormData();
    new_group_obj.append("name",groupData.name);
    new_group_obj.append("description",groupData.description);
    new_group_obj.append("image",groupData.image);
    new_group_obj.append("members",groupData.members);
    new_group_obj.append("groupImage",groupData.imageFile)
    console.log(new_group_obj)
    createGroup(new_group_obj);

  };

  return (
    <div className="h-screen bg-[#1a1e23] grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className={`flex flex-col justify-center items-center pt-20 pb-5 px-5 ${
  groupData.members.length >= 3 ? "sm:pt-60" : "sm:pt-20"
} relative overflow-y-auto`}>        {/* Pattern Background - Only visible on desktop */}
       

        <div className="w-full max-w-md space-y-8 z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-lg bg-[#0e7970] flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold mt-2 text-white">Create New Group</h1>
              <p className="text-gray-400">Enter group details and select members</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Group Image */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-2 border-teal-500 flex items-center justify-center overflow-hidden">
                  {groupData.image ? (
                    <img src={groupData.image} alt="Group" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <label htmlFor="groupImage" className="absolute bottom-0 right-0 bg-teal-500 p-2 rounded-full cursor-pointer">
                  <ImageIcon className="w-4 h-4 text-white" />
                </label>
                <input 
                  id="groupImage" 
                  name='groupImage'
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                />
              </div>
            </div>

            {/* Group Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Group Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  className="w-full bg-transparent text-white pl-10 pr-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter group name"
                  value={groupData.name}
                  onChange={(e) => setGroupData({ ...groupData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Group Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <Info className="h-5 w-5 text-gray-500" />
                </div>
                <textarea
                  className="w-full bg-transparent text-white pl-10 pr-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Group description"
                  rows="3"
                  value={groupData.description}
                  onChange={(e) => setGroupData({ ...groupData, description: e.target.value })}
                ></textarea>
              </div>
            </div>

            {/* Select Members */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Add Existing Contacts
              </label>
              <div className="relative">
                <select 
                  className="w-full bg-transparent text-white px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  onChange={(e) => {
                    const contactId = e.target.value;
                    if (contactId) {
                      const contact = contacts.find(c => c._id == contactId);
                      handleAddContact(contact);
                    }
                  }}
                  value=""
                >
                  <option value="" disabled className="bg-[#1a1e23] text-gray-400">Select contacts</option>
                  {contacts.map(contact => (
                    !selectedContacts.some(c => c._id == contact._id) && (
                      <option key={contact?._id} value={contact?._id} className="bg-[#1a1e23] text-white">
                        {contact?.name} ({contact.phone})
                      </option>
                    )
                  ))}
                </select>
              </div>
            </div>

            {/* Add New Contact */}
            <div className="bg-gray-800 bg-opacity-50 p-4 rounded-md">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Add New Contact
              </label>
              
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    className="w-full bg-transparent text-white pl-10 pr-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Contact name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="tel"
                    className="w-full bg-transparent text-white pl-10 pr-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="+91 98765 43210"
                    value={newContact.phoneNumber}
                    onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                  />
                </div>
                
                <button
                  type="button"
                  onClick={handleAddNewContact}
                  disabled={!newContact.name || !newContact.phoneNumber}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add to Group
                </button>
              </div>
            </div>

            {/* Selected Members */}
            {selectedContacts.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Selected Members ({selectedContacts.length})
                </label>
                <div className="max-h-36 overflow-y-auto space-y-2 bg-gray-800 bg-opacity-40 p-3 rounded-md">
                  {selectedContacts.map(contact => (
                    <div key={contact._id} className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded-md">
                      <div>
                        <span className="text-gray-200">{contact.name}</span>
                        <span className="text-gray-400 text-sm ml-2">{contact.phoneNumber}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveContact(contact.id)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Link
                to="/"
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 flex items-center justify-center"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Cancel
              </Link>

              <button 
                type="submit" 
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-opacity-50 flex items-center justify-center" 
                disabled={isCreatingGroup || selectedContacts.length === 0 || !groupData.name}
              >
                {isCreatingGroup ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Create Group
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Only visible on desktop */}
      <div className="hidden lg:flex bg-teal-500 flex-col justify-center items-center text-white p-12 relative">
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full grid grid-cols-12 gap-4">
            {Array(150).fill().map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-white"></div>
            ))}
          </div>
        </div>
        
        <div className="max-w-md z-10">
          <h2 className="text-3xl font-bold mb-4">Create group conversations</h2>
          <p className="text-lg opacity-90">
            Connect with multiple contacts at once. Create groups for family, friends, work teams, or special events to share messages with everyone simultaneously.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;