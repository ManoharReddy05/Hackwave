import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("my-groups");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      
      const response = await axios.get("http://localhost:5000/api/groups", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allGroups = response.data;
      
      // Separate my groups from all groups
      const userGroups = allGroups.filter(group => 
        group.members?.some(m => (m._id || m) === userId) || 
        group.admins?.some(a => (a._id || a) === userId)
      );
      
      setMyGroups(userGroups);
      setGroups(allGroups);
    } catch (err) {
      console.error("Error fetching groups:", err);
      setError("Failed to load groups. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/groups", newGroup, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowCreateModal(false);
      setNewGroup({ name: "", description: "", isPrivate: false });
      fetchGroups();
    } catch (err) {
      console.error("Error creating group:", err);
      alert(err.response?.data?.message || "Failed to create group");
    }
  };

  const handleJoinGroup = async (groupId) => {
    // Navigate to group detail page instead of joining directly
    navigate(`/groups/${groupId}`);
  };

  const displayedGroups = activeSection === "my-groups" ? myGroups : groups;
  
  const filteredGroups = displayedGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading groups...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Study Groups</h1>
          <p className="page-subtitle">Join groups to collaborate and learn together</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Group
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Section Toggle */}
      <div className="tabs-container" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab-button ${activeSection === "my-groups" ? "active" : ""}`}
          onClick={() => setActiveSection("my-groups")}
        >
          My Groups ({myGroups.length})
        </button>
        <button
          className={`tab-button ${activeSection === "all-groups" ? "active" : ""}`}
          onClick={() => setActiveSection("all-groups")}
        >
          All Groups ({groups.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search groups by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Groups Grid */}
      <div className="groups-grid">
        {filteredGroups.length === 0 ? (
          <p className="no-data">
            {activeSection === "my-groups" 
              ? "You haven't joined any groups yet. Explore all groups to get started!" 
              : "No groups found. Create one to get started!"}
          </p>
        ) : (
          filteredGroups.map((group) => (
            <div key={group._id} className="group-card">
              <div className="group-header">
                <h3 className="group-name">{group.name}</h3>
                {group.isPrivate && (
                  <span className="badge badge-private">🔒 Private</span>
                )}
              </div>
              
              <p className="group-description">
                {group.description || "No description provided"}
              </p>
              
              <div className="group-stats">
                <span className="stat">
                  <strong>{group.members?.length || 0}</strong> members
                </span>
                <span className="stat">
                  <strong>{group.admins?.length || 0}</strong> admins
                </span>
              </div>
              
              <div className="group-meta">
                <small>Created {new Date(group.createdAt).toLocaleDateString()}</small>
              </div>
              
              <div className="group-actions">
                <button 
                  className="btn btn-primary btn-small"
                  onClick={() => handleJoinGroup(group._id)}
                >
                  View Group
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Group</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="modal-form">
              <div className="form-group">
                <label htmlFor="groupName">Group Name *</label>
                <input
                  type="text"
                  id="groupName"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="Enter group name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="groupDescription">Description</label>
                <textarea
                  id="groupDescription"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="What is this group about?"
                  rows="4"
                />
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newGroup.isPrivate}
                    onChange={(e) => setNewGroup({ ...newGroup, isPrivate: e.target.checked })}
                  />
                  Make this group private
                </label>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
