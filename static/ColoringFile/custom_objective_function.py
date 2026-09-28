import numpy as np

def calculate_user_color_preferences(image_hsv):
    user_prefs = np.array([[359, 91, 55],
                           [353, 51, 28],
                           [34, 84, 89],
                           [45, 100, 69],
                           [132, 100, 31],
                           [268, 57, 61],
                           [0, 0, 88]], dtype=np.int32)
    
    h = image_hsv[:, :, 0].astype(np.int32) * 2
    s = image_hsv[:, :, 1].astype(np.int32)
    v = image_hsv[:, :, 2].astype(np.int32)
    
    unique_colors = np.unique(np.column_stack((h.ravel(), s.ravel(), v.ravel())), axis=0)
    
    if unique_colors.shape[0] != user_prefs.shape[0]:
        fitness = 0.0
        return fitness
    
    sorted_unique = np.sort(unique_colors, axis=0)
    sorted_prefs = np.sort(user_prefs, axis=0)
    
    if np.array_equal(sorted_unique, sorted_prefs):
        fitness = 1.0
    else:
        hue_diff = np.minimum(np.abs(sorted_unique[:, 0] - sorted_prefs[:, 0]), 
                              360 - np.abs(sorted_unique[:, 0] - sorted_prefs[:, 0]))
        sat_diff = np.abs(sorted_unique[:, 1] - sorted_prefs[:, 1])
        val_diff = np.abs(sorted_unique[:, 2] - sorted_prefs[:, 2])
        
        hue_penalty = np.mean(hue_diff) / 180.0
        sat_penalty = np.mean(sat_diff) / 255.0
        val_penalty = np.mean(val_diff) / 255.0
        
        total_penalty = (hue_penalty + sat_penalty + val_penalty) / 3.0
        fitness = max(0.0, 1.0 - total_penalty)
    
    return fitness