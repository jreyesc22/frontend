import React from 'react';
import { Box, Typography } from '@mui/material';

const QuestionResponse = ({ answer }) => {
  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="body1" color="text.primary">
        Respuesta: {answer}
      </Typography>
    </Box>
  );
};

export default QuestionResponse;