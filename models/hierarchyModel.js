const roleSchema = new Schema({
  roleName: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    enum: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']
  },
  description: {
    type: String,
    trim: true
  },
}, {
  timestamps: true
});

const Role = model("Role", roleSchema);
export default Role;
