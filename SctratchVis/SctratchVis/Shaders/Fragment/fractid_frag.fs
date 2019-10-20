#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)

in vec2 oTexCoord;

uniform float uFreq;
uniform float uLastFreq;
uniform float uDeltaFreq;

uniform float uTime;
uniform float uLastFrame;
uniform float uDeltaTime;

uniform float[256] uSpectrum;

uniform vec2 uRes;

out vec4 retColor;

float sinc(float x)
{
	float ret = sin(x) / x;
	return ret;
}

float cosc(float x)
{
	float ret = cos(x) / x;
	return ret;
}

mat2 rot2(float a) 
{
	float s = sinc(a);
	float c = cos(a);

	mat2 ret = mat2(
		s, c,
		-c, s
	);

	return ret;
}


vec3 fn(vec2 p)
{
	float dp = dot(p, p);

	p /= dp;

	vec3 ret = fract(vec3(p, dp));

	return ret;
}

vec3 fractal()
{
	float ft = smoothstep(uFreq * uTime, uLastFreq, uDeltaFreq * uDeltaTime);
	ft *= cosc(uFreq);

	vec2 p = 0.5 - gl_FragCoord.xy / uRes.xy  * 0.5;
	vec3 o = fn((fn(p).xy * cosc(uFreq) - 1.0) * rot2(-uTime) * uFreq);

	o *= ft - uSpectrum[int(ft * length(o))];

	vec3 ret = o;
	ret.xy *= rot2(uFreq);

	return ret * uFreq;
}

vec4 col(vec2 p)
{
	float t = sin(uTime/2.)*10.;    
	vec2 r = p;
	r.x += 0.5;

	float ft = smoothstep(uFreq * uTime, uLastFreq, uDeltaFreq * uDeltaTime);

    vec2 o = gl_FragCoord.xy - r/2.;
    o = vec2(length(o) / r.y - .3, atan(o.x,o.y));    
    vec4 s = uFreq*cos(1.6*vec4(0,1,2,3) + t + o.x + sin(o.x) / cos(3.9*o.y) * tan(o.y) * cos(sin(atan(t)))*1.5),
    e = s.yzwx, 
    f = min(o.x-s,e-o.x);
    f += atan(o.x-s,e-o.x);
    f *= sin(t/50.);

    return dot(clamp(f*r.y,0.,1.), 40.*(s-e)) * (s-.1) - f;
}

void main()
{
	vec2 uv = gl_FragCoord.xy + uRes * sinc(uFreq / uTime);

	vec4 ret;

	ret = vec4(fractal(), 1.0);
	ret *= col(uv);
	retColor = ret;
}