import React from 'react'
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Create theme
const defaultTheme = createTheme();

const Authentication = () => {
    const navigate = useNavigate();
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [formState, setFormState] = React.useState(0); // 0 for Login, 1 for Register
    const [open, setOpen] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    const handleAuth = async () => {
        try {
            if (formState === 0) {
                // Login logic
                let result = await handleLogin(username, password);
                // Navigate to dashboard or home page after login
                navigate('/home'); // Adjust the navigation path accordingly
            }
            if (formState === 1) {
                // Register logic
                let result = await handleRegister(name, username, password, confirmPassword);
                setMessage(result);
                setOpen(true);
                setError('');
                setFormState(0); // After registration, switch to login form
                setPassword(''); // Clear password field
                setUsername(''); // Clear username field
                setConfirmPassword(''); // Clear confirm password field
                setName(''); // Clear full name field
            }
        } catch (error) {
            setError(error.response?.data?.message || 'An error occurred');
            setMessage('');
        }
    }

    const toggleForm = (newFormState) => {
        setFormState(newFormState);
        setError(''); // Clear any error when switching forms
        setMessage(''); // Clear any message when switching forms
    }

    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />
                <Grid
                    item
                    xs={false}
                    sm={4}
                    md={7}
                    sx={{
                        backgroundImage: 'url(https://source.unsplash.com/random?wallpapers)',
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: (t) =>
                            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                    <Box sx={{ my: 8, mx: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                            <LockOutlinedIcon />
                        </Avatar>
    
                        <div>
                            <Button variant={formState === 0 ? "contained" : ""} onClick={() => toggleForm(0)}>
                                Sign In
                            </Button>
                            <Button variant={formState === 1 ? "contained" : ""} onClick={() => toggleForm(1)}>
                                Sign Up
                            </Button>
                        </div>
    
                        <Box component="form" noValidate sx={{ mt: 1 }}>
                            {formState === 1 && (  // Sign Up Form Fields
                                <>
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="name"
                                        label="Full Name"
                                        name="name"
                                        value={name}
                                        autoFocus
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="username"
                                        label="Username"
                                        name="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        name="password"
                                        label="Password"
                                        value={password}
                                        type="password"
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        name="confirmPassword"
                                        label="Confirm Password"
                                        value={confirmPassword}
                                        type="password"
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </>
                            )}
    
                            {formState === 0 && (  // Login Form Fields
                                <>
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="username"
                                        label="Username"
                                        name="username"
                                        value={username}
                                        autoFocus
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        name="password"
                                        label="Password"
                                        value={password}
                                        type="password"
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </>
                            )}
    
                            {error && <p style={{ color: "red" }}>{error}</p>}
    
                            <Button
                                type="button"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                                onClick={handleAuth}
                            >
                                {formState === 0 ? "Login" : "Register"}
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
    
            <Snackbar open={open} autoHideDuration={4000} message={message} />
        </ThemeProvider>
    )
    
}

export default Authentication;
