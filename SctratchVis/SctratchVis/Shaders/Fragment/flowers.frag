#version 410

#define PI		3.1415926535897932384626433832795
#define TAU		(2.0 * PI)
#define MIN_DIST 0.0001
#define MAX_DIST 1-+75.0

uniform float uFreq;
uniform float uLastFreq;
uniform float uTime;
uniform vec2 uRes;

#define cosc(x) cos(x) / x
#define sinc(x) sin(x) / x

out vec4 retColor;

mat2 rot(float a)
{
	return mat2(
		cos(a), -sin(a),
		sin(a), cos(a)
	);
}

vec2 hash22(vec2 p)
{
	float n = sin(dot(p, vec2(31.0, 289.0)));
	p = fract(vec2(362144.0, 42768.0) * n);

	vec2 ret;

	ret = sin(p * 7.2831853 + uTime) * 0.55 + 0.5;

	return ret;
}

float voronoi(vec2 p)
{
	vec2 g = floor(p);
	vec2 o;
	vec3 d = vec3(2.0);

	for (int y = -2; y <= 2; y++)
		for (int x = -2; x <= 2; x++)
		{
			o = vec2(x, y);
			o += hash22(g + o) - p;
			d.z = dot(o, o);

			d.y = max(d.x, min(d.y, d.z));
			d.x = min(d.x, d.z);
		}

	float ret;

	ret = max(d.y / 0.6 - d.x * 0.5, 0.0) / 2.2;

	return ret;
}

vec3 bg_waves(vec2 p)
{
	vec3 ret = vec3(0.0);

	float e = 0.0;
	float ff = fract(fract(uFreq * 100.0) + fract(uFreq * 10.0)) + (fract(uFreq / uFreq) * 10.0); 

	float t = sinc(ff) / cosc(ff);
	t *= uTime;//mod(uTime, ff);

	//t = uTime;

	for (float i = 3.0; i <= 17.0; i+= 1.0)
	{
		e += 0.1 / ((i / 2.0) + cos(t / 5.0 + 1.1 * 1 * (p.x) * (sin(i / 9.0 + t / 9.0 - p.x * 0.2))) + 1.0 + 5.5 * p.y);
	}

	ret = vec3(0.0 - p.y * e * 1.4, e / 2.0, e);

	return ret;
}

vec3 col1(vec2 p)
{
	vec3 ret = vec3(0.0);

    //float t = uTime + sin(uFreq);
	float f = abs(uFreq + uLastFreq / mod(uTime, 1.0)) * 0.5;
	float ff = fract(fract(f * 100.0) + fract(f * 10.0)) + (fract(f / f) * 10.0); 
	//t = cos(mod(sin(ff), t));
	float t = sinc(ff) / cosc(ff);
	ff = abs(abs(ff - f) - uLastFreq) - (t * 0.2) * 0.05;

	float r = ff;
	float g = sin(ff);
	float b = cos(ff);

	ret = vec3(r, g, b); 

	ret *= mix(bg_waves(p), bg_waves(-p), voronoi(vec2(f) / p));
	ret /= bg_waves(p);

	//ret = bg_waves(p);

	return ret;
}

vec3 col2(vec2 p)
{
	vec3 ret = vec3(0.0);

	return ret;
}

void main()
{	
	vec4 ret;
	vec2 uv;
	uv = (gl_FragCoord.xy - uRes) / min(uRes.x, uRes.y);

	ret = vec4(col1(uv * 1.75), 1.0);

	retColor = ret;
}